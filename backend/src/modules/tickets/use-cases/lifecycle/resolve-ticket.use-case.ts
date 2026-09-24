import {
  CommentVisibility,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";
import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import { assertValidTicketTransition } from "../../policies/ticket-transition.policy";
import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";
import type { ResolveTicketBody } from "../../ticket.schemas";
import {
  NotificationType,
} from "../../../../generated/prisma/client";
import { createNotifications } from "../../../notifications/notification.service";
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

export async function resolveTicketUseCase(
  ticketId: number,
  body: ResolveTicketBody,
  actor: AuthenticatedUser,
) {

  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(actor, "RESOLVE", ticketId);

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

    assertTicketLifecycleAccess(actor, "RESOLVE", ticket);

    if (ticket.status !== TicketStatus.IN_PROGRESS) {
      throw new AppError(
        "CONFLICT",
        "Only tickets in IN_PROGRESS can be resolved.",
      );
    }

    const isPrivilegedOverride =
      actor.role === UserRole.CENTER_MANAGER ||
      actor.role === UserRole.ADMIN;

    if (isPrivilegedOverride && !body.reason?.trim()) {
      throw new AppError(
        "VALIDATION_ERROR",
        "A reason is required when a Manager or Admin resolves a ticket.",
        [{ field: "reason", message: "Reason is required." }],
      );
    }

    assertValidTicketTransition(ticket.status, TicketStatus.RESOLVED);

    const resolvedAt = new Date();

    // Guard against a concurrent status change or technician reassignment.
    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        status: TicketStatus.IN_PROGRESS,

        ...(actor.role === UserRole.TECHNICIAN
          ? { assigneeId: actor.userId }
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
        status: TicketStatus.RESOLVED,
        resolvedAt,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket changed while the resolution was being processed. Please reload and try again.",
      );
    }

    // Complete the active resolution SLA cycle.
    const activeSlaCycle = await tx.ticketSlaCycle.findFirst({
      where: {
        ticketId: ticket.id,
        resolvedAt: null,
      },
      orderBy: {
        cycleNumber: "desc",
      },
      select: {
        id: true,
        dueAt: true,
      },
    });

    if (!activeSlaCycle) {
      throw new AppError(
        "CONFLICT",
        "No active SLA cycle exists for this ticket.",
      );
    }

    const slaOutcome =
      resolvedAt <= activeSlaCycle.dueAt ? "MET" : "BREACHED";

    const cycleUpdateResult = await tx.ticketSlaCycle.updateMany({
      where: {
        id: activeSlaCycle.id,
        resolvedAt: null,
      },
      data: {
        resolvedAt,
        outcome: slaOutcome,
      },
    });

    if (cycleUpdateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "The SLA cycle changed while the ticket was being resolved. Please reload and try again.",
      );
    }

    // Resolution details are always visible to the requester.
    await tx.comment.create({
      data: {
        ticketId: ticket.id,
        authorId: actor.userId,
        content: body.resolution,
        visibility: CommentVisibility.PUBLIC,
      },
    });

    await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.RESOLVED,
        fromValue: TicketStatus.IN_PROGRESS,
        toValue: TicketStatus.RESOLVED,
        description: isPrivilegedOverride
          ? body.reason!.trim()
          : "Ticket resolved by assigned technician.",
      },
    });

    await createAuditLog(
      {
        action: "TICKET_RESOLVED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,
        oldValue: {
          status: TicketStatus.IN_PROGRESS,
        },
        newValue: {
          status: TicketStatus.RESOLVED,
          resolvedAt,
        },
        metadata: {
          lifecycleAction: "RESOLVE",
          ticketNumber: ticket.ticketNumber,
          resolution: body.resolution,
          privilegedOverride: isPrivilegedOverride,
          overrideReason: isPrivilegedOverride
            ? body.reason!.trim()
            : null,
          slaOutcome,
          slaDueAt: activeSlaCycle.dueAt,
        },
      },
      tx,
    );

    // Notify the requester that the ticket has been resolved.
    createdNotifications = await createNotifications(tx, {
      recipientIds: [ticket.requesterId],
      type: NotificationType.TICKET_RESOLVED,
      title: "Ticket resolved",
      message: `Ticket ${ticket.ticketNumber} has been resolved. Please review the resolution and confirm closure when ready.`,
      ticketId: ticket.id,
    });

    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: ticketInclude,
      }),
      recipientIds: [ticket.requesterId],
    };
  });

    for (const userId of [...new Set(result.recipientIds)]) {
    publishToUser(userId, "ticket:resolved", {
      ticketId: result.ticket.id,
      centerId: result.ticket.centerId,
      status: result.ticket.status,
      resolvedAt: result.ticket.resolvedAt,
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