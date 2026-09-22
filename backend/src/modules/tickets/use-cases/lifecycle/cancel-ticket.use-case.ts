import {
  TicketHistoryEvent,
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
import {
  NotificationType,
} from "../../../../generated/prisma/client";
import { createNotifications } from "../../../notifications/notification.service";
import { publishToUser } from "../../../../socket/socket.server";


const ticketInclude = {
  requester: {
    select: { id: true, fullName: true, email: true },
  },
  assignee: {
    select: { id: true, fullName: true, email: true },
  },
  center: {
    select: { id: true, name: true, code: true },
  },
  lab: {
    select: { id: true, name: true, code: true },
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

  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(actor, "CANCEL", ticketId);

    const ticket = await tx.ticket.findFirst({
      where: scope,
      select: {
        id: true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
      },
    });

    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    assertTicketLifecycleAccess(actor, "CANCEL", ticket);

    if (!cancellableStatuses.includes(ticket.status)) {
      throw new AppError(
        "CONFLICT",
        "Only tickets that have not been resolved or closed can be cancelled.",
      );
    }

    assertValidTicketTransition(ticket.status, TicketStatus.CANCELLED);

    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        status: ticket.status,
        ...(actor.role === UserRole.EMPLOYEE
          ? { requesterId: actor.userId }
          : {}),
        ...(actor.role === UserRole.CENTER_MANAGER
          ? {
              center: {
                userAccess: {
                  some: { userId: actor.userId },
                },
              },
            }
          : {}),
      },
      data: {
        status: TicketStatus.CANCELLED,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket status changed before it could be cancelled. Refresh and try again.",
      );
    }

    await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.CANCELLED,
        fromValue: ticket.status,
        toValue: TicketStatus.CANCELLED,
        description: body.reason,
      },
    });

    // Notify the requester and assigned technician about cancellation.
    const recipientIds: number[] = [ticket.requesterId];

    if (ticket.assigneeId !== null) {
      recipientIds.push(ticket.assigneeId);
    }

    createdNotifications = await createNotifications(tx, {
      recipientIds,
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: "Ticket cancelled",
      message: `Ticket #${ticket.id} has been cancelled.`,
      ticketId: ticket.id,
    });

    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: ticketInclude,
      }),
      recipientIds,
    };
  });
    
  for (const userId of [...new Set(result.recipientIds)]) {
    publishToUser(userId, "ticket:cancelled", {
      ticketId: result.ticket.id,
      centerId: result.ticket.centerId,
      status: result.ticket.status,
      updatedAt: result.ticket.updatedAt,
    });
  }

  for (const notification of createdNotifications) {
    publishToUser(notification.userId, "notification:created", {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      ticketId: notification.ticketId,
      createdAt: notification.createdAt,
    });
  }

  return result.ticket;
}