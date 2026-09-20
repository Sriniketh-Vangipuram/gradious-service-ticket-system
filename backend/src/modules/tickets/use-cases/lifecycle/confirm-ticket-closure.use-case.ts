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
  return prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(
      actor,
      "CONFIRM_CLOSURE",
      ticketId,
    );

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

    // Prevent stale/concurrent closure attempts.
    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        requesterId: actor.userId,
        status: TicketStatus.RESOLVED,
      },
      data: {
        status: TicketStatus.CLOSED,
        closedAt: new Date(),
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

    return tx.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketInclude,
    });
  });
}