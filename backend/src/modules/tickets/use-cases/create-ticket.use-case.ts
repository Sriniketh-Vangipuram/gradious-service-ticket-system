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

type AuthenticatedActor = {
  userId: number;
  role: string;
};

function isPrismaUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createTicketUseCase(
  input: CreateTicketInput,
  actor: AuthenticatedActor,
  idempotencyKey: string,
) {
  // 1. Verify the actor's role.
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

  // 2. Enforce priority policy.
  // Employees may choose LOW, MEDIUM, or HIGH.
  // CRITICAL is reserved for staff.
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

  let eventRecipientIds: number[] = [];

  let createdNotifications: Array<{
    id: number;
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    ticketId: number | null;
    createdAt: Date;
  }> = [];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 3. Reserve the idempotency key.
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

      // 4. Confirm the requester exists, is active,
      //    and still has the role represented by the actor.
      const requester = await tx.user.findUnique({
        where: {
          id: actor.userId,
        },
        select: {
          id: true,
          isActive: true,
          role: true,

          // Required for employee-created tickets.
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

      // Use the database role, not only the JWT role.
      if (requester.role !== actor.role) {
        throw new AppError(
          "FORBIDDEN",
          "Your account permissions have changed. Please sign in again.",
        );
      }

      /*
       * 5. Resolve the ticket's center and lab.
       *
       * Employees do NOT choose these values.
       * They are derived from the employee's organizational assignment.
       *
       * Staff users continue using the explicit center/lab supplied
       * in the request for now.
       */
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

      // 6. Verify the resolved center exists and is active.
      const center = await tx.center.findUnique({
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

      /*
       * 7. Non-admin users must have explicit center access.
       *
       * For employees this is an additional authorization check
       * around their assigned center.
       */
      if (requester.role !== UserRole.ADMIN) {
        const centerAccess = await tx.userCenter.findUnique({
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

      // 8. Verify the resolved lab belongs to the resolved center
      //    and is active.
      const lab = await tx.lab.findFirst({
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

      // 9. Verify category exists and is active.
      const category = await tx.category.findUnique({
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

      // 10. Enforce software-specific fields using category.code.
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

      // 11. Verify selected software exists and is active.
      if (input.softwareId !== undefined) {
        const software = await tx.software.findUnique({
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

      // 12. Load the active SLA policy.
      const slaPolicy = await getActiveSlaPolicy(
        input.priority,
        tx,
      );

      // Use one consistent start timestamp for SLA calculations.
      const slaStartedAt = new Date();

      // Calculate deadlines using the resolved center.
      const firstResponseDueAt = await addBusinessMinutes({
        startAt: slaStartedAt,
        businessMinutes: slaPolicy.firstResponseMinutes,
        centerId: ticketCenterId,
        db: tx,
      });

      const resolutionDueAt = await addBusinessMinutes({
        startAt: slaStartedAt,
        businessMinutes: slaPolicy.resolutionMinutes,
        centerId: ticketCenterId,
        db: tx,
      });

      // 13. Reserve yearly sequential ticket number.
      const year = new Date().getFullYear();

      const ticketNumber = await reserveTicketNumber(
        tx,
        year,
      );

      // 14. Create ticket.
      //
      // Important:
      // - requesterId comes from authentication.
      // - centerId/labId come from the resolved assignment.
      // - assigneeId is intentionally NOT provided.
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

          slaCycles: {
            create: {
              cycleNumber: 1,
              startedAt: slaStartedAt,
              dueAt: resolutionDueAt,
              targetMinutes:
                slaPolicy.resolutionMinutes,
              atRiskThresholdPercent:
                slaPolicy.atRiskThresholdPercent,
            },
          },

          history: {
            create: {
              event: TicketHistoryEvent.CREATED,
              actorId: requester.id,
              toValue: "OPEN",
              description: "Ticket created.",
            },
          },
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

      // 15. Find active staff members who have access
      //     to the ticket's center.
      const staffMemberships =
        await tx.userCenter.findMany({
          where: {
            centerId: ticketCenterId,
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

      // 16. Persist ticket-created notifications atomically.
      createdNotifications = await createNotifications(tx, {
        recipientIds: [
          requester.id,
          ...staffRecipientIds,
        ],
        type: NotificationType.TICKET_CREATED,
        title: "New service ticket created",
        message: `Ticket ${ticket.ticketNumber}-${ticket.title} has been created.`,
        ticketId: ticket.id,
      });

      const responseBody = createSuccessBody({
        ticket,
      });

      // 17. Store idempotent response.
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

      eventRecipientIds = [
        requester.id,
        ...staffRecipientIds,
      ];

      return {
        ticket,
        replayed: false,
        responseStatus: 201,
        responseBody,
      };
    });

    // 18. Publish realtime ticket event.
    if (!result.replayed) {
      for (const userId of eventRecipientIds) {
        publishToUser(userId, "ticket:created", {
          ticketId: result.ticket.id,
          ticketNumber: result.ticket.ticketNumber,
          centerId: result.ticket.centerId,
          status: result.ticket.status,
          createdAt: result.ticket.createdAt,
        });
      }
    }

    // 19. Publish notification events.
    if (!result.replayed) {
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
    }

    return result;
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) {
      throw error;
    }

    // The transaction has failed and rolled back.
    // Check whether this user/key already has a committed record.
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

    // A different unique constraint may have caused P2002.
    if (!existingRecord) {
      throw error;
    }

    if (existingRecord.requestHash !== requestHash) {
      throw new AppError(
        "CONFLICT",
        "This Idempotency-Key has already been used with a different request.",
      );
    }

    // A committed record should contain the response because
    // the record and response are written in the same transaction.
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