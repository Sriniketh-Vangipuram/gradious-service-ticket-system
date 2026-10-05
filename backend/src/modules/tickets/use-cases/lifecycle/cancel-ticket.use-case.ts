import {
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";

import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import type { CancelTicketBody } from "../../ticket.schemas";

import { assertValidTicketTransition } from "../../policies/ticket-transition.policy";

import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";

import { publishToUser } from "../../../../socket/socket.server";

import {
  cancelTicketInTransaction,
} from "./cancel-ticket-in-transaction.use-case";

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

const cancellableStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.TRIAGED,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
];

export async function cancelTicketUseCase(
  ticketId: number,
  body: CancelTicketBody,
  actor: AuthenticatedUser,
) {
  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(
      actor,
      "CANCEL",
      ticketId,
    );

    const ticket = await tx.ticket.findFirst({
      where: scope,
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

    assertTicketLifecycleAccess(
      actor,
      "CANCEL",
      ticket,
    );

    if (!cancellableStatuses.includes(ticket.status)) {
      throw new AppError(
        "CONFLICT",
        "Only tickets that have not been resolved or closed can be cancelled.",
      );
    }

    assertValidTicketTransition(
      ticket.status,
      TicketStatus.CANCELLED,
    );

    const cancellation =
      await cancelTicketInTransaction({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        currentStatus: ticket.status,
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
        centerId: ticket.centerId,
        actorId: actor.userId,
        reason: body.reason,
        db: tx,
      });

    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: {
          id: ticket.id,
        },
        include: ticketInclude,
      }),

      recipientIds: cancellation.recipientIds,

      notifications: cancellation.notifications,
    };

  },
  {
    maxWait: 5000,
    timeout: 15000,
  }
);

  /*
   * Socket events happen after the transaction commits.
   * This prevents clients from receiving an event for a
   * transaction that subsequently rolls back.
   */
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