import {
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";

import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import { createNotifications } from "../../../notifications/notification.service";
import {
  assertValidTicketTransition,
} from "../../policies/ticket-transition.policy";

import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";

import { publishToUser } from "../../../../socket/socket.server";

import {
  cancelTicketInTransaction,
} from "./cancel-ticket-in-transaction.use-case";


const cancellableStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.TRIAGED,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
];

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
};

export async function approveCancellationRequestUseCase(
  ticketId: number,
  historyId: number,
  actor: AuthenticatedUser,
) {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only an administrator can approve a cancellation request.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Verify that the ticket exists.
     */
    const ticket = await tx.ticket.findUnique({
      where: {
        id: ticketId,
      },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
      },
    });

    if (!ticket) {
      throw new AppError(
        "NOT_FOUND",
        "Ticket not found.",
      );
    }

    /*
     * Approval itself is an administrative lifecycle action.
     */
    assertTicketLifecycleAccess(
      actor,
      "CANCEL",
      ticket,
    );

    /*
     * Find the exact TicketHistory row being approved.
     */
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
        fromValue: true,
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
     * Prevent an old request from being approved after a
     * newer cancellation request/rejection/final cancellation.
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
     * The ticket must still be cancellable.
     */
    if (!cancellableStatuses.includes(ticket.status)) {
        throw new AppError(
            "CONFLICT",
            "This ticket can no longer be cancelled.",
        );
    }

    assertValidTicketTransition(
      ticket.status,
      TicketStatus.CANCELLED,
    );

    if (!request.description?.trim()) {
      throw new AppError(
        "CONFLICT",
        "The cancellation request does not contain a valid reason.",
      );
    }

    /*
     * Perform the real cancellation using the same engine
     * used by direct cancellation.
     *
     * IMPORTANT:
     * We use the manager's original reason as the final
     * cancellation reason, not the admin's approval action.
     */
    const cancellation =
      await cancelTicketInTransaction({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        currentStatus: ticket.status,
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
        centerId: ticket.centerId,
        actorId: actor.userId,
        reason: request.description,
        db: tx,
        lifecycleAction:"APPROVE_CANCELLATION",
      });

    /*
     * Notify the manager who requested cancellation.
     */
    if (request.actorId !== null) {
      const managerNotifications =
        await createNotifications(tx, {
          recipientIds: [request.actorId],
          type: "TICKET_STATUS_CHANGED",
          title: "Cancellation request approved",
          message: `Your cancellation request for ${ticket.ticketNumber} was approved. The ticket has been cancelled.`,
          ticketId: ticket.id,
        });

      cancellation.notifications.push(
        ...managerNotifications,
      );

      cancellation.recipientIds.push(
        ...managerNotifications.map(
          (notification) => notification.userId,
        ),
      );
    }

    /*
     * Audit the administrative approval.
     */
    await tx.auditLog.create({
      data: {
        action: "TICKET_STATUS_CHANGED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,
        oldValue: {
          status: ticket.status,
        },
        newValue: {
          status: TicketStatus.CANCELLED,
        },
        metadata: {
          lifecycleAction: "APPROVE_CANCELLATION",
          ticketNumber: ticket.ticketNumber,
          cancellationRequestHistoryId:
            request.id,
          requestedBy: request.actorId,
          cancellationReason:
            request.description,
        },
      },
    });

    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: {
          id: ticket.id,
        },
        include: ticketInclude,
      }),

      recipientIds: [
        ...new Set(cancellation.recipientIds),
      ],

      notifications: cancellation.notifications,
    }  },
    {
      maxWait: 5000,
      timeout: 15000,
    },
  );

  for (const userId of [
    ...new Set(result.recipientIds),
  ]) {
    publishToUser(
      userId,
      "ticket:cancelled",
      {
        ticketId: result.ticket.id,
        centerId: result.ticket.centerId,
        status: result.ticket.status,
        updatedAt: result.ticket.updatedAt,
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

  return result.ticket;
}