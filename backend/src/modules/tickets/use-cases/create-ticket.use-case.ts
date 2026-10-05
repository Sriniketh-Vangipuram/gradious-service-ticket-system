import {
  TicketHistoryEvent,
  UserRole,
  NotificationType,
} from "../../../generated/prisma/client";

import { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { CreateTicketInput } from "../ticket.schemas";
import { reserveTicketNumber } from "../ticket-number.service";
import { addBusinessMinutes } from "../../sla/business-calendar.service";
import { getActiveSlaPolicy } from "../../sla/sla-policy.service";

import { createNotifications } from "../../notifications/notification.service";
import { createHash } from "node:crypto";
import { createSuccessBody } from "../../../common/http/api-response";
import { publishToUser } from "../../../socket/socket.server";
import { createAuditLog } from "../../audit/audit.service";

type AuthenticatedActor = {
  userId: number;
  role: UserRole;
};

function isPrismaUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createTicketUseCase(
  input: CreateTicketInput,
  actor: AuthenticatedActor,
  idempotencyKey: string,
) {
  // ============================================================
  // 1. Request-level authorization
  // ============================================================

  const allowedRoles: string[] = [
    UserRole.EMPLOYEE,
    UserRole.TECHNICIAN,
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ];

  if (!allowedRoles.includes(actor.role)) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to create tickets.",
    );
  }

  if (
    actor.role === UserRole.EMPLOYEE &&
    input.priority === "CRITICAL"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "Employees cannot submit tickets with CRITICAL priority.",
    );
  }

  const requestHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");

  /*
   * ============================================================
   * 2. PREFLIGHT VALIDATION
   *
   * These operations are read-only and do not need to hold an
   * interactive transaction open.
   *
   * This is intentionally outside the transaction to keep the
   * atomic transaction short and predictable.
   * ============================================================
   */

  const requester = await prisma.user.findUnique({
    where: {
      id: actor.userId,
    },
    select: {
      id: true,
      isActive: true,
      role: true,
      centerId: true,
      labId: true,
    },
  });

  if (!requester || !requester.isActive) {
    throw new AppError(
      "UNAUTHENTICATED",
      "Your account is not available.",
    );
  }

  if (requester.role !== actor.role) {
    throw new AppError(
      "FORBIDDEN",
      "Your account permissions have changed. Please sign in again.",
    );
  }

  // ------------------------------------------------------------
  // Resolve center and lab
  // ------------------------------------------------------------

  let ticketCenterId: number;
  let ticketLabId: number;

  if (requester.role === UserRole.EMPLOYEE) {
    if (requester.centerId === null) {
      throw new AppError(
        "VALIDATION_ERROR",
        "You are not assigned to a center. Please contact an administrator.",
      );
    }

    if (requester.labId === null) {
      throw new AppError(
        "VALIDATION_ERROR",
        "You are not assigned to a lab. Please contact your center manager.",
      );
    }

    ticketCenterId = requester.centerId;
    ticketLabId = requester.labId;
  } else {
    if (input.centerId === undefined) {
      throw new AppError(
        "VALIDATION_ERROR",
        "A center is required when creating a ticket.",
        [
          {
            field: "body.centerId",
            message: "Choose a center.",
          },
        ],
      );
    }

    if (input.labId === undefined) {
      throw new AppError(
        "VALIDATION_ERROR",
        "A lab is required when creating a ticket.",
        [
          {
            field: "body.labId",
            message: "Choose a lab.",
          },
        ],
      );
    }

    ticketCenterId = input.centerId;
    ticketLabId = input.labId;
  }

  // ------------------------------------------------------------
  // Verify center
  // ------------------------------------------------------------

  const center = await prisma.center.findUnique({
    where: {
      id: ticketCenterId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!center || !center.isActive) {
    throw new AppError(
      "NOT_FOUND",
      "The selected center was not found or is inactive.",
    );
  }

  // ------------------------------------------------------------
  // Verify center access
  // ------------------------------------------------------------

  if (requester.role !== UserRole.ADMIN) {
    const centerAccess = await prisma.userCenter.findUnique({
      where: {
        userId_centerId: {
          userId: requester.id,
          centerId: ticketCenterId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!centerAccess) {
      throw new AppError(
        "FORBIDDEN",
        "You are not authorized to create tickets for this center.",
      );
    }
  }

  // ------------------------------------------------------------
  // Verify lab
  // ------------------------------------------------------------

  const lab = await prisma.lab.findFirst({
    where: {
      id: ticketLabId,
      centerId: ticketCenterId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!lab) {
    throw new AppError(
      "VALIDATION_ERROR",
      "The selected lab is invalid or does not belong to the selected center.",
      [
        {
          field: "body.labId",
          message:
            "Choose an active lab belonging to the selected center.",
        },
      ],
    );
  }

  // ------------------------------------------------------------
  // Verify category
  // ------------------------------------------------------------

  const category = await prisma.category.findUnique({
    where: {
      id: input.categoryId,
    },
    select: {
      id: true,
      code: true,
      isActive: true,
    },
  });

  if (!category || !category.isActive) {
    throw new AppError(
      "VALIDATION_ERROR",
      "The selected category is invalid or inactive.",
      [
        {
          field: "body.categoryId",
          message: "Choose an active category.",
        },
      ],
    );
  }

  // ------------------------------------------------------------
  // Enforce software-specific fields
  // ------------------------------------------------------------

  const isSoftwareCategory = category.code === "SOFTWARE";

  const hasSoftwareFields =
    input.softwareId !== undefined &&
    input.requestType !== undefined;

  if (isSoftwareCategory && !hasSoftwareFields) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Software requests require a software selection and request type.",
      [
        {
          field: "body.softwareId",
          message:
            "Required for software-category tickets.",
        },
        {
          field: "body.requestType",
          message:
            "Required for software-category tickets.",
        },
      ],
    );
  }

  if (!isSoftwareCategory && hasSoftwareFields) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Software fields are only allowed for software-category tickets.",
      [
        {
          field: "body.categoryId",
          message:
            "Software fields require the SOFTWARE category.",
        },
      ],
    );
  }

  // ------------------------------------------------------------
  // Verify software
  // ------------------------------------------------------------

  if (input.softwareId !== undefined) {
    const software = await prisma.software.findUnique({
      where: {
        id: input.softwareId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!software || !software.isActive) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected software is invalid or inactive.",
        [
          {
            field: "body.softwareId",
            message:
              "Choose active software from the catalog.",
          },
        ],
      );
    }
  }

  /*
   * ============================================================
   * 3. SLA CALCULATION
   *
   * These are read/calculation operations, so they happen before
   * the transaction.
   * ============================================================
   */

  const slaPolicy = await getActiveSlaPolicy(
    input.priority,
    prisma,
  );

  const slaStartedAt = new Date();

  const firstResponseDueAt = await addBusinessMinutes({
    startAt: slaStartedAt,
    businessMinutes: slaPolicy.firstResponseMinutes,
    centerId: ticketCenterId,
    db: prisma,
  });

  const resolutionDueAt = await addBusinessMinutes({
    startAt: slaStartedAt,
    businessMinutes: slaPolicy.resolutionMinutes,
    centerId: ticketCenterId,
    db: prisma,
  });

  /*
   * ============================================================
   * 4. SHORT ATOMIC TRANSACTION
   *
   * Only operations that must succeed together remain here.
   *
   * Ticket number + ticket + history + SLA cycle + audit +
   * idempotency response are kept atomic.
   * ============================================================
   */

  try {
    const result = await prisma.$transaction(
      async (tx) => {
      // --------------------------------------------------------
      // Idempotency reservation
      // --------------------------------------------------------

      await tx.idempotencyRecord.create({
        data: {
          userId: actor.userId,
          key: idempotencyKey,
          requestHash,
          expiresAt: new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ),
        },
      });

      // --------------------------------------------------------
      // Reserve ticket number
      // --------------------------------------------------------

      const year = new Date().getFullYear();

      const ticketNumber = await reserveTicketNumber(
        tx,
        year,
      );

      // --------------------------------------------------------
      // Create ticket
      // --------------------------------------------------------

      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          title: input.title,
          description: input.description,
          priority: input.priority,
          requestType: input.requestType,
          softwareId: input.softwareId,

          requesterId: requester.id,

          centerId: ticketCenterId,
          labId: ticketLabId,

          categoryId: input.categoryId,

          status: "OPEN",

          firstResponseDueAt,
          resolutionDueAt,

          firstResponseTargetMinutes:
            slaPolicy.firstResponseMinutes,

          resolutionTargetMinutes:
            slaPolicy.resolutionMinutes,

          atRiskThresholdPercent:
            slaPolicy.atRiskThresholdPercent,
        },

        select: {
          id: true,
          ticketNumber: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          requestType: true,
          requesterId: true,
          assigneeId: true,
          centerId: true,
          labId: true,
          categoryId: true,
          softwareId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // --------------------------------------------------------
      // Required ticket history
      // --------------------------------------------------------

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.CREATED,
          actorId: requester.id,
          toValue: "OPEN",
          description: "Ticket created.",
        },
      });

      // --------------------------------------------------------
      // Initial SLA cycle
      // --------------------------------------------------------

      await tx.ticketSlaCycle.create({
        data: {
          ticketId: ticket.id,
          cycleNumber: 1,
          startedAt: slaStartedAt,
          dueAt: resolutionDueAt,
          targetMinutes: slaPolicy.resolutionMinutes,
          atRiskThresholdPercent:
            slaPolicy.atRiskThresholdPercent,
        },
      });

      // --------------------------------------------------------
      // Audit log
      // --------------------------------------------------------

      await createAuditLog(
        {
          action: "TICKET_CREATED",
          entityType: "TICKET",
          entityId: String(ticket.id),
          actorId: requester.id,

          newValue: {
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            description: ticket.description,
            status: ticket.status,
            priority: ticket.priority,
            requestType: ticket.requestType,
            requesterId: ticket.requesterId,
            centerId: ticket.centerId,
            labId: ticket.labId,
            categoryId: ticket.categoryId,
            softwareId: ticket.softwareId,
            firstResponseDueAt,
            resolutionDueAt,
            firstResponseTargetMinutes:
              slaPolicy.firstResponseMinutes,
            resolutionTargetMinutes:
              slaPolicy.resolutionMinutes,
            atRiskThresholdPercent:
              slaPolicy.atRiskThresholdPercent,
          },

          metadata: {
            source: "TICKET_CREATION",
            slaPolicyPriority: input.priority,
          },
        },
        tx,
      );

      // --------------------------------------------------------
      // Store idempotent response
      // --------------------------------------------------------

      const responseBody = createSuccessBody({
        ticket,
      });

      await tx.idempotencyRecord.update({
        where: {
          userId_key: {
            userId: actor.userId,
            key: idempotencyKey,
          },
        },
        data: {
          responseStatus: 201,
          responseBody,
        },
      });

      return {
        ticket,
        replayed: false,
        responseStatus: 201,
        responseBody,
      };
    },{
      maxWait: 5000,
      timeout: 15000,
    }
  );

    /*
     * ============================================================
     * 5. POST-COMMIT SIDE EFFECTS
     *
     * These happen only after the ticket transaction commits.
     *
     * Failure here must NOT turn a successfully-created ticket
     * into an HTTP 500 response.
     * ============================================================
     */

    let eventRecipientIds: number[] = [];

    try {
      const staffMemberships =
        await prisma.userCenter.findMany({
          where: {
            centerId: result.ticket.centerId,
            user: {
              isActive: true,
              role: {
                in: [
                  UserRole.CENTER_MANAGER,
                  UserRole.ADMIN,
                ],
              },
            },
          },
          select: {
            userId: true,
          },
        });

      const staffRecipientIds = staffMemberships.map(
        (membership) => membership.userId,
      );

      eventRecipientIds = [
        requester.id,
        ...staffRecipientIds,
      ];

      const createdNotifications =
        await createNotifications(prisma, {
          recipientIds: eventRecipientIds,
          type: NotificationType.TICKET_CREATED,
          title: "New service ticket created",
          message: `Ticket ${result.ticket.ticketNumber}-${result.ticket.title} has been created.`,
          ticketId: result.ticket.id,
        });

      // Ticket realtime event
      for (const userId of eventRecipientIds) {
        publishToUser(userId, "ticket:created", {
          ticketId: result.ticket.id,
          ticketNumber: result.ticket.ticketNumber,
          centerId: result.ticket.centerId,
          status: result.ticket.status,
          createdAt: result.ticket.createdAt,
        });
      }

      // Notification realtime events
      for (const notification of createdNotifications) {
        publishToUser(
          notification.userId,
          "notification:created",
          {
            notificationId: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            ticketId: notification.ticketId,
            createdAt: notification.createdAt,
          },
        );
      }
    } catch (error: unknown) {
      /*
       * The ticket has already committed successfully.
       * Notification/socket failure must not change the HTTP
       * result into an unsuccessful ticket creation.
       */
      console.error(
        "[TicketCreate] Post-commit notification/event processing failed:",
        error,
      );
    }

    return result;
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) {
      throw error;
    }

    /*
     * ============================================================
     * 6. IDEMPOTENCY REPLAY
     * ============================================================
     */

    const existingRecord =
      await prisma.idempotencyRecord.findUnique({
        where: {
          userId_key: {
            userId: actor.userId,
            key: idempotencyKey,
          },
        },
        select: {
          requestHash: true,
          responseStatus: true,
          responseBody: true,
        },
      });

    // A different unique constraint caused the P2002.
    if (!existingRecord) {
      throw error;
    }

    if (existingRecord.requestHash !== requestHash) {
      throw new AppError(
        "CONFLICT",
        "This Idempotency-Key has already been used with a different request.",
      );
    }

    if (
      existingRecord.responseStatus === null ||
      existingRecord.responseBody === null
    ) {
      throw new AppError(
        "CONFLICT",
        "This request is already being processed. Please retry shortly.",
      );
    }

    return {
      ticket: null,
      replayed: true,
      responseStatus: existingRecord.responseStatus,
      responseBody: existingRecord.responseBody,
    };
  }
}