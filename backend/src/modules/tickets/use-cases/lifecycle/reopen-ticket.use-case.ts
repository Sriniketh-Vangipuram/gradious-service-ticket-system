import {
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";
import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import type { ReopenTicketBody } from "../../ticket.schemas";
import { assertValidTicketTransition } from "../../policies/ticket-transition.policy";
import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";

import { addBusinessMinutes } from "../../../sla/business-calendar.service";
import { getActiveSlaPolicy } from "../../../sla/sla-policy.service";

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

export async function reopenTicketUseCase(
  ticketId: number,
  body: ReopenTicketBody,
  actor: AuthenticatedUser,
) {

  let createdNotifications: Awaited< 
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(actor, "REOPEN", ticketId);

    const ticket = await tx.ticket.findFirst({
      where: scope,
      select: {
        id: true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
        priority:true,
      },
    });

    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    assertTicketLifecycleAccess(actor, "REOPEN", ticket);

    if (ticket.status !== TicketStatus.RESOLVED) {
      throw new AppError(
        "CONFLICT",
        "Only resolved tickets can be reopened through this action.",
      );
    }

    assertValidTicketTransition(
      ticket.status,
      TicketStatus.IN_PROGRESS,
    );

    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        status: TicketStatus.RESOLVED,
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
        status: TicketStatus.IN_PROGRESS,
        resolvedAt: null,
        closedAt: null,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket status changed before it could be reopened. Refresh and try again.",
      );
    }

    // Start a new resolution SLA cycle for the reopened ticket.
      const slaPolicy = await getActiveSlaPolicy(ticket.priority, tx);

      const slaStartedAt = new Date();

      const resolutionDueAt = await addBusinessMinutes({
        startAt: slaStartedAt,
        businessMinutes: slaPolicy.resolutionMinutes,
        centerId: ticket.centerId,
        db: tx,
      });

      // Determine the next cycle number for this ticket.
      const latestCycle = await tx.ticketSlaCycle.findFirst({
        where: { ticketId: ticket.id },
        orderBy: { cycleNumber: "desc" },
        select: { cycleNumber: true },
      });

      const nextCycleNumber = (latestCycle?.cycleNumber ?? 0) + 1;

      await tx.ticketSlaCycle.create({
        data: {
          ticketId: ticket.id,
          cycleNumber: nextCycleNumber,
          startedAt: slaStartedAt,
          dueAt: resolutionDueAt,
          targetMinutes: slaPolicy.resolutionMinutes,
          atRiskThresholdPercent: slaPolicy.atRiskThresholdPercent,
        },
      });

    // Update the ticket's current resolution SLA snapshot.
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        resolutionDueAt,
        resolutionTargetMinutes: slaPolicy.resolutionMinutes,
      },
    });

    await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.REOPENED,
        fromValue: TicketStatus.RESOLVED,
        toValue: TicketStatus.IN_PROGRESS,
        description: body.reason,
      },
    });

    // Notify the requester and assigned technician about reopening.
    const recipientIds: number[] = [ticket.requesterId];

    if (ticket.assigneeId !== null) {
      recipientIds.push(ticket.assigneeId);
    }

    createdNotifications = await createNotifications(tx, {
      recipientIds,
      type: NotificationType.TICKET_REOPENED,
      title: "Ticket reopened",
      message: `Ticket #${ticket.id} has been reopened and moved to IN_PROGRESS.`,
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
    publishToUser(userId, "ticket:reopened", {
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