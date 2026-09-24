import {
  TicketHistoryEvent,
  TicketStatus,
} from "../../../../generated/prisma/client";
import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import { assertValidTicketTransition } from "../../policies/ticket-transition.policy";
import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";
import { createNotifications } from "../../../notifications/notification.service";
import {
  NotificationType,
} from "../../../../generated/prisma/client";
import { publishToUser } from "../../../../socket/socket.server";
import { createAuditLog } from "../../../audit/audit.service";



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

export async function confirmTicketClosureUseCase(
  ticketId: number,
  actor: AuthenticatedUser,
) {

  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];
  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(
      actor,
      "CONFIRM_CLOSURE",
      ticketId,
    );

    const ticket = await tx.ticket.findFirst({
      where: scope,
      select: {
        id: true,
        ticketNumber:true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
      },
    });

    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    assertTicketLifecycleAccess(actor, "CONFIRM_CLOSURE", ticket);

    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new AppError(
        "CONFLICT",
        "Only resolved tickets can be closed by the requester.",
      );
    }

    assertValidTicketTransition(
      ticket.status,
      TicketStatus.CLOSED,
    );

     const closedAt = new Date();
    // Prevent stale/concurrent closure attempts.
    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        requesterId: actor.userId,
        status: TicketStatus.RESOLVED,
      },
      data: {
        status: TicketStatus.CLOSED,
        closedAt,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket changed while closure was being processed. Please reload and try again.",
      );
    }

    await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.CLOSED,
        fromValue: TicketStatus.RESOLVED,
        toValue: TicketStatus.CLOSED,
        description: "Ticket closed by requester confirmation.",
      },
    });

    await createAuditLog(
      {
        action: "TICKET_CLOSED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,
        oldValue: {
          status: TicketStatus.RESOLVED,
        },
        newValue: {
          status: TicketStatus.CLOSED,
          closedAt,
        },
        metadata: {
          lifecycleAction: "CONFIRM_CLOSURE",
          ticketNumber: ticket.ticketNumber,
          closureConfirmedByRequester: true,
        },
      },
      tx,
    );

    // Notify the assigned technician that the requester closed the ticket.
    if (ticket.assigneeId !== null) {
      createdNotifications = await createNotifications(tx, {
        recipientIds: [ticket.assigneeId],
        type: NotificationType.TICKET_STATUS_CHANGED,
        title: "Ticket closed",
        message: `Ticket ${ticket.ticketNumber} was closed by the requester.`,        
        ticketId: ticket.id,
      });
    }


    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: ticketInclude,
      }),
      recipientIds: [
        ticket.requesterId,
        ...(ticket.assigneeId !== null ? [ticket.assigneeId] : []),
      ],
    };
  });

    for (const userId of [...new Set(result.recipientIds)]) {
    publishToUser(userId, "ticket:closed", {
      ticketId: result.ticket.id,
      centerId: result.ticket.centerId,
      status: result.ticket.status,
      closedAt: result.ticket.closedAt,
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