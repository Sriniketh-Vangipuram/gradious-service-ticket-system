import {
  NotificationType,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";

import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import type { ReviewCancellationRequestBody } from "../../ticket.schemas";

import {
  createNotifications,
} from "../../../notifications/notification.service";

import { createAuditLog } from "../../../audit/audit.service";

import { publishToUser } from "../../../../socket/socket.server";


const cancellableStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.TRIAGED,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
];

export async function rejectCancellationRequestUseCase(
  ticketId: number,
  historyId: number,
  body: ReviewCancellationRequestBody,
  actor: AuthenticatedUser,
) {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only an administrator can reject a cancellation request.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: {
        id: ticketId,
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
      },
    });

    if (!ticket) {
      throw new AppError(
        "NOT_FOUND",
        "Ticket not found.",
      );
    }

    const request = await tx.ticketHistory.findFirst({
      where: {
        id: historyId,
        ticketId,
        event: TicketHistoryEvent.STATUS_CHANGED,
        toValue: "CANCELLATION_REQUESTED",
      },
      select: {
        id: true,
        actorId: true,
        description: true,
        createdAt: true,
      },
    });

    if (!request) {
      throw new AppError(
        "NOT_FOUND",
        "Cancellation request not found.",
      );
    }

    /*
     * Only the latest cancellation workflow entry may be
     * reviewed.
     */
    const latestCancellationHistory =
      await tx.ticketHistory.findFirst({
        where: {
          ticketId,
          OR: [
            {
              event: TicketHistoryEvent.STATUS_CHANGED,
              toValue: {
                in: [
                  "CANCELLATION_REQUESTED",
                  "CANCELLATION_REJECTED",
                ],
              },
            },
            {
              event: TicketHistoryEvent.CANCELLED,
              toValue: TicketStatus.CANCELLED,
            },
          ],
        },
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        select: {
          id: true,
          toValue: true,
        },
      });

    if (
      !latestCancellationHistory ||
      latestCancellationHistory.id !== request.id ||
      latestCancellationHistory.toValue !==
        "CANCELLATION_REQUESTED"
    ) {
      throw new AppError(
        "CONFLICT",
        "This cancellation request is no longer pending.",
      );
    }

    /*
     * The ticket itself must still be cancellable.
     */
    if (!cancellableStatuses.includes(ticket.status)) {
        throw new AppError(
            "CONFLICT",
            "This ticket can no longer have its cancellation request reviewed.",
        );
    }

    /*
     * Store rejection using the existing TicketHistory model.
     *
     * No schema change is required.
     */
    const rejection =
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: actor.userId,
          event: TicketHistoryEvent.STATUS_CHANGED,
          fromValue: ticket.status,
          toValue: "CANCELLATION_REJECTED",
          description: body.reason,
        },
      });

    await createAuditLog(
      {
        action: "TICKET_STATUS_CHANGED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,
        oldValue: {
          status: ticket.status,
        },
        newValue: {
          status: ticket.status,
        },
        metadata: {
          lifecycleAction: "REJECT_CANCELLATION",
          ticketNumber: ticket.ticketNumber,
          cancellationRequestHistoryId:
            request.id,
          rejectionHistoryId: rejection.id,
          requestedBy: request.actorId,
          rejectionReason: body.reason,
        },
      },
      tx,
    );

    let notifications: Awaited<
      ReturnType<typeof createNotifications>
    > = [];

    if (request.actorId !== null) {
      notifications = await createNotifications(
        tx,
        {
          recipientIds: [request.actorId],
          type: NotificationType.TICKET_STATUS_CHANGED,
          title: "Cancellation request rejected",
          message: `Your cancellation request for ${ticket.ticketNumber} was rejected. Reason: ${body.reason}`,
          ticketId: ticket.id,
        },
      );
    }

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      rejectionHistoryId: rejection.id,
      recipientIds:
        request.actorId !== null
          ? [request.actorId]
          : [],
      notifications,
    };
  });

  for (const userId of [
    ...new Set(result.recipientIds),
  ]) {
    publishToUser(
      userId,
      "ticket:cancellation-request-rejected",
      {
        ticketId: result.ticketId,
        status: result.status,
        updatedAt: new Date(),
      },
    );
  }

  for (const notification of result.notifications) {
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

  return result;
}