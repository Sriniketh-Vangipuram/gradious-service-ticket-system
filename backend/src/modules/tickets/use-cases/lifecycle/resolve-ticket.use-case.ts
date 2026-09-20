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
  return prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(actor, "RESOLVE", ticketId);

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
        resolvedAt: new Date(),
    },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket changed while the resolution was being processed. Please reload and try again.",
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

    return tx.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketInclude,
    });
  });
}