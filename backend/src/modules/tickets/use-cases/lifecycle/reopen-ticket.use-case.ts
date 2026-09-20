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
  return prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(actor, "REOPEN", ticketId);

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

    return tx.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketInclude,
    });
  });
}