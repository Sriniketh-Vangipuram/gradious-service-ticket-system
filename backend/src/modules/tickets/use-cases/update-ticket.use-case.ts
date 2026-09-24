import {
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";
import { publishToUser } from "../../../socket/socket.server";

import type { UpdateTicketBody } from "../ticket.schemas";
import type { TicketUpdateActor } from "../policies/ticket-update-scope.policy";

import { buildTicketUpdateScope } from "../policies/ticket-update-scope.policy";

const ticketInclude = {
  requester: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  assignee: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  center: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  lab: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  category: true,

  software: true,
} satisfies Prisma.TicketInclude;

/**
 * Fields an EMPLOYEE is allowed to edit.
 *
 * Employees can only modify the actual request details.
 *
 * They cannot modify:
 * - center
 * - lab
 * - priority
 * - status
 * - requester
 * - assignments
 */
const employeeEditableFields = new Set([
  "title",
  "description",
  "categoryId",
  "softwareId",
  "requestType",
]);

/**
 * Technicians can update textual ticket information
 * while working on a ticket.
 *
 * Lifecycle changes such as START_WORK, WAIT_FOR_USER,
 * RESOLVE, etc. are handled by dedicated use cases.
 */
const technicianEditableFields = new Set([
  "title",
  "description",
]);

/**
 * Center managers currently have the same generic editable
 * fields as employees.
 *
 * Priority changes should NOT be handled by this generic
 * update endpoint because priority is coupled to SLA policy.
 *
 * A dedicated SLA-aware priority-change workflow can
 * be introduced later.
 */
const managerEditableFields = new Set([
  ...employeeEditableFields,
]);

/**
 * Admin currently follows the same generic update contract.
 *
 * Administrative workflows such as reassignment, priority
 * changes, center transfer, etc. should have dedicated
 * use cases rather than bypassing their domain rules through
 * a generic PATCH endpoint.
 */
const adminEditableFields = new Set([
  ...managerEditableFields,
]);

function assertAllowedFields(
  body: UpdateTicketBody,
  actor: TicketUpdateActor,
): void {
  let allowedFields: Set<string>;

  switch (actor.role) {
    case UserRole.EMPLOYEE:
      allowedFields = employeeEditableFields;
      break;

    case UserRole.TECHNICIAN:
      allowedFields = technicianEditableFields;
      break;

    case UserRole.CENTER_MANAGER:
      allowedFields = managerEditableFields;
      break;

    case UserRole.ADMIN:
      allowedFields = adminEditableFields;
      break;

    default:
      throw new AppError(
        "FORBIDDEN",
        "You are not allowed to update tickets.",
      );
  }

  const forbiddenFields = Object.keys(body).filter(
    (field) => !allowedFields.has(field),
  );

  if (forbiddenFields.length > 0) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to update one or more of the provided fields.",
      forbiddenFields.map((field) => ({
        field: `body.${field}`,
        message: "This field cannot be updated by your role.",
      })),
    );
  }
}

/**
 * Creates history records for meaningful domain-field changes.
 *
 * This function runs inside the same Prisma transaction as the
 * ticket update, so the ticket update and its audit history
 * either both succeed or both roll back.
 *
 * No history record is created for a no-op update.
 */
async function createTicketUpdateHistory(
  tx: Prisma.TransactionClient,
  ticketId: number,
  actorId: number,
  existingState: {
    categoryId: number;
    softwareId: number | null;
    requestType: string | null;
  },
  resultingState: {
    categoryId: number;
    softwareId: number | null;
    requestType: string | null;
  },
): Promise<void> {
  const historyRecords: Prisma.TicketHistoryCreateManyInput[] = [];

  /*
   * CATEGORY
   */
  if (
    existingState.categoryId !==
    resultingState.categoryId
  ) {
    historyRecords.push({
      ticketId,
      actorId,

      event: TicketHistoryEvent.CATEGORY_CHANGED,

      fromValue: String(existingState.categoryId),

      toValue: String(resultingState.categoryId),

      description: "Ticket category changed.",
    });
  }

  /*
   * SOFTWARE
   */
  if (
    existingState.softwareId !==
    resultingState.softwareId
  ) {
    historyRecords.push({
      ticketId,
      actorId,

      event: TicketHistoryEvent.SOFTWARE_CHANGED,

      fromValue:
        existingState.softwareId === null
          ? null
          : String(existingState.softwareId),

      toValue:
        resultingState.softwareId === null
          ? null
          : String(resultingState.softwareId),

      description: "Ticket software changed.",
    });
  }

  /*
   * REQUEST TYPE
   */
  if (
    existingState.requestType !==
    resultingState.requestType
  ) {
    historyRecords.push({
      ticketId,
      actorId,

      event: TicketHistoryEvent.REQUEST_TYPE_CHANGED,

      fromValue: existingState.requestType,

      toValue: resultingState.requestType,

      description: "Ticket request type changed.",
    });
  }

  /*
   * Only write when something actually changed.
   */
  if (historyRecords.length === 0) {
    return;
  }

  await tx.ticketHistory.createMany({
    data: historyRecords,
  });
}

export async function updateTicketUseCase(
  ticketId: number,
  body: UpdateTicketBody,
  actor: TicketUpdateActor,
) {
  let eventRecipientIds: number[] = [];

  /*
   * ---------------------------------------------------------
   * PATCH SEMANTICS
   * ---------------------------------------------------------
   *
   * undefined -> field was not supplied
   * null      -> explicitly clear nullable field
   * value     -> explicitly set field
   *
   * softwareId and requestType are a logical pair.
   * Therefore they must either both be present in the
   * request or neither must be present.
   */
  const hasSoftwareId = body.softwareId !== undefined;
  const hasRequestType = body.requestType !== undefined;

  if (hasSoftwareId !== hasRequestType) {
    throw new AppError(
      "VALIDATION_ERROR",
      "softwareId and requestType must be provided together.",
      [
        {
          field: hasSoftwareId
            ? "body.requestType"
            : "body.softwareId",

          message:
            "Software and request type must be provided together.",
        },
      ],
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    /*
     * ---------------------------------------------------------
     * 1. AUTHORIZATION / TICKET SCOPE
     * ---------------------------------------------------------
     */
    const scope = buildTicketUpdateScope(
      ticketId,
      actor,
    );

    const existingTicket = await tx.ticket.findFirst({
      where: scope,

      select: {
        id: true,

        requesterId: true,

        assigneeId: true,

        status: true,

        categoryId: true,

        softwareId: true,

        requestType: true,
      },
    });

    if (!existingTicket) {
      /*
       * Do not reveal whether the ticket exists but belongs
       * to somebody else.
       *
       * Unauthorized and nonexistent tickets both appear
       * as NOT_FOUND.
       */
      throw new AppError(
        "NOT_FOUND",
        "Ticket not found.",
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. FIELD-LEVEL AUTHORIZATION
     * ---------------------------------------------------------
     */
    assertAllowedFields(body, actor);

    /*
     * ---------------------------------------------------------
     * 3. EMPLOYEE OPEN-ONLY RULE
     * ---------------------------------------------------------
     */
    if (
      actor.role === UserRole.EMPLOYEE &&
      existingTicket.status !== TicketStatus.OPEN
    ) {
      throw new AppError(
        "CONFLICT",
        "You can only edit tickets while they are OPEN.",
      );
    }

    /*
     * ---------------------------------------------------------
     * 4. BUILD RESULTING DOMAIN STATE
     * ---------------------------------------------------------
     *
     * PATCH requests contain only changed fields.
     *
     * Domain validation therefore operates against the
     * complete resulting state.
     */
    const resultingCategoryId =
      body.categoryId !== undefined
        ? body.categoryId
        : existingTicket.categoryId;

    const resultingSoftwareId =
      body.softwareId !== undefined
        ? body.softwareId
        : existingTicket.softwareId;

    const resultingRequestType =
      body.requestType !== undefined
        ? body.requestType
        : existingTicket.requestType;

    /*
     * Detect actual domain changes.
     *
     * These values are later used for TicketHistory.
     */
    const categoryChanged =
      resultingCategoryId !==
      existingTicket.categoryId;

    const softwareChanged =
      resultingSoftwareId !==
      existingTicket.softwareId;

    const requestTypeChanged =
      resultingRequestType !==
      existingTicket.requestType;

    /*
     * ---------------------------------------------------------
     * 5. CATEGORY VALIDATION
     * ---------------------------------------------------------
     */
    const category = await tx.category.findUnique({
      where: {
        id: resultingCategoryId,
      },

      select: {
        id: true,

        code: true,

        isActive: true,
      },
    });

    if (!category) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected category does not exist.",
        [
          {
            field: "body.categoryId",
            message: "Choose an existing category.",
          },
        ],
      );
    }

    if (!category.isActive) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected category is inactive.",
        [
          {
            field: "body.categoryId",
            message: "Choose an active category.",
          },
        ],
      );
    }

    /*
     * ---------------------------------------------------------
     * 6. CATEGORY / SOFTWARE / REQUEST TYPE INVARIANT
     * ---------------------------------------------------------
     *
     * SOFTWARE category:
     *
     *   softwareId != null
     *   requestType != null
     *
     * Non-SOFTWARE category:
     *
     *   softwareId == null
     *   requestType == null
     */
    const isSoftwareCategory =
      category.code === "SOFTWARE";

    if (isSoftwareCategory) {
      if (
        resultingSoftwareId === null ||
        resultingRequestType === null
      ) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Software and request type are required for software tickets.",
          [
            {
              field: "body.softwareId",
              message:
                "Software must be selected for a SOFTWARE category.",
            },
            {
              field: "body.requestType",
              message:
                "Request type must be selected for a SOFTWARE category.",
            },
          ],
        );
      }
    } else {
      if (
        resultingSoftwareId !== null ||
        resultingRequestType !== null
      ) {
        throw new AppError(
          "VALIDATION_ERROR",
          "Software and request type are only allowed for software tickets.",
          [
            {
              field: "body.softwareId",
              message:
                "Clear softwareId when using a non-SOFTWARE category.",
            },
            {
              field: "body.requestType",
              message:
                "Clear requestType when using a non-SOFTWARE category.",
            },
          ],
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 7. SOFTWARE VALIDATION
     * ---------------------------------------------------------
     */
    if (resultingSoftwareId !== null) {
      const software = await tx.software.findUnique({
        where: {
          id: resultingSoftwareId,
        },

        select: {
          id: true,

          isActive: true,
        },
      });

      if (!software) {
        throw new AppError(
          "VALIDATION_ERROR",
          "The selected software does not exist.",
          [
            {
              field: "body.softwareId",
              message: "Choose existing software.",
            },
          ],
        );
      }

      if (!software.isActive) {
        throw new AppError(
          "VALIDATION_ERROR",
          "The selected software is inactive.",
          [
            {
              field: "body.softwareId",
              message: "Choose active software.",
            },
          ],
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 8. BUILD DATABASE UPDATE
     * ---------------------------------------------------------
     *
     * We deliberately do NOT update:
     *
     * - centerId
     * - labId
     * - priority
     * - status
     * - requester
     * - assignee
     *
     * Those belong to dedicated domain workflows.
     */
    const data: Prisma.TicketUpdateInput = {};

    if (body.title !== undefined) {
      data.title = body.title;
    }

    if (body.description !== undefined) {
      data.description = body.description;
    }

    if (body.categoryId !== undefined) {
      data.category = {
        connect: {
          id: body.categoryId,
        },
      };
    }

    if (body.softwareId !== undefined) {
      data.software =
        body.softwareId === null
          ? {
              disconnect: true,
            }
          : {
              connect: {
                id: body.softwareId,
              },
            };
    }

    if (body.requestType !== undefined) {
      data.requestType = body.requestType;
    }

    /*
     * ---------------------------------------------------------
     * 9. ATOMIC UPDATE — EMPLOYEE
     * ---------------------------------------------------------
     */
    if (actor.role === UserRole.EMPLOYEE) {
      try {
        const updatedTicket =
          await tx.ticket.update({
            where: {
              id: existingTicket.id,

              requesterId: actor.userId,

              status: TicketStatus.OPEN,
            },

            data,

            include: ticketInclude,
          });

        /*
         * -----------------------------------------------------
         * CREATE UPDATE HISTORY
         * -----------------------------------------------------
         *
         * This happens inside the same transaction.
         */
        await createTicketUpdateHistory(
          tx,

          updatedTicket.id,

          actor.userId,

          {
            categoryId:
              existingTicket.categoryId,

            softwareId:
              existingTicket.softwareId,

            requestType:
              existingTicket.requestType,
          },

          {
            categoryId:
              resultingCategoryId,

            softwareId:
              resultingSoftwareId,

            requestType:
              resultingRequestType,
          },
        );

        /*
         * Build socket recipients.
         */
        eventRecipientIds = [
          updatedTicket.requesterId,
        ];

        if (
          updatedTicket.assigneeId !== null
        ) {
          eventRecipientIds.push(
            updatedTicket.assigneeId,
          );
        }

        return {
          ticket: updatedTicket,

          changed:
            categoryChanged ||
            softwareChanged ||
            requestTypeChanged ||
            body.title !== undefined ||
            body.description !== undefined,
        };
      } catch (error) {
        /*
         * Prisma P2025 means the guarded update found
         * no matching record.
         *
         * The ticket may have changed status concurrently.
         */
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "P2025"
        ) {
          throw new AppError(
            "CONFLICT",
            "You can only edit tickets while they are OPEN.",
          );
        }

        throw error;
      }
    }

    /*
     * ---------------------------------------------------------
     * 10. ATOMIC UPDATE — STAFF
     * ---------------------------------------------------------
     *
     * Non-employees already passed their role-specific
     * authorization scope above.
     */
    const updatedTicket =
      await tx.ticket.update({
        where: {
          id: existingTicket.id,
        },

        data,

        include: ticketInclude,
      });

    /*
     * ---------------------------------------------------------
     * CREATE UPDATE HISTORY
     * ---------------------------------------------------------
     */
    await createTicketUpdateHistory(
      tx,

      updatedTicket.id,

      actor.userId,

      {
        categoryId:
          existingTicket.categoryId,

        softwareId:
          existingTicket.softwareId,

        requestType:
          existingTicket.requestType,
      },

      {
        categoryId:
          resultingCategoryId,

        softwareId:
          resultingSoftwareId,

        requestType:
          resultingRequestType,
      },
    );

    /*
     * Build socket recipients.
     */
    eventRecipientIds = [
      updatedTicket.requesterId,
    ];

    if (
      updatedTicket.assigneeId !== null
    ) {
      eventRecipientIds.push(
        updatedTicket.assigneeId,
      );
    }

    return {
      ticket: updatedTicket,

      changed:
        categoryChanged ||
        softwareChanged ||
        requestTypeChanged ||
        body.title !== undefined ||
        body.description !== undefined,
    };
  });

  /*
   * ---------------------------------------------------------
   * 11. REAL-TIME EVENT
   * ---------------------------------------------------------
   *
   * Publish ONLY after the transaction succeeds.
   *
   * If the transaction rolls back, clients must not receive
   * a false ticket-updated event.
   */
  if (result.changed) {
    const uniqueRecipientIds = [
      ...new Set(eventRecipientIds),
    ];

    for (const userId of uniqueRecipientIds) {
      publishToUser(
        userId,

        "ticket:updated",

        {
          ticketId:
            result.ticket.id,

          centerId:
            result.ticket.centerId,

          status:
            result.ticket.status,

          priority:
            result.ticket.priority,

          updatedAt:
            result.ticket.updatedAt,
        },
      );
    }
  }

  return result.ticket;
}