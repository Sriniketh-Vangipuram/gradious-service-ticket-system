
import {
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";

import type { Prisma } from "../../../../generated/prisma/client";

import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";

import {
  assertValidTicketTransition,
} from "../../policies/ticket-transition.policy";

import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";

import { createNotifications } from "../../../notifications/notification.service";

import {
  NotificationType,
} from "../../../../generated/prisma/client";

import type { TicketLifecycleAction } from "../../policies/ticket-lifecycle-access.policy";

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
} satisfies Prisma.TicketInclude;

type OrdinaryTicketStatus = Extract<
  TicketStatus,
  "TRIAGED" | "ASSIGNED" | "IN_PROGRESS" | "WAITING_FOR_USER"
>;

const statusActionMap: Partial<
  Record<OrdinaryTicketStatus, TicketLifecycleAction>
> = {
  TRIAGED: "TRIAGE",
  ASSIGNED: "MARK_ASSIGNED",
  IN_PROGRESS: "START_WORK",
  WAITING_FOR_USER: "WAIT_FOR_USER",
};

function assertOrdinaryStatus(
  status: TicketStatus,
): asserts status is OrdinaryTicketStatus {
  if (!(status in statusActionMap)) {
    throw new AppError(
      "VALIDATION_ERROR",
      "This status must be changed through its dedicated lifecycle action.",
    );
  }
}

export async function changeTicketStatusUseCase(
  ticketId: number,
  nextStatus: OrdinaryTicketStatus,
  actor: AuthenticatedUser,
) {
  // 1. Restrict this use case to ordinary transitions.
  assertOrdinaryStatus(nextStatus);

  const action = statusActionMap[nextStatus];

  if (!action) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Unsupported ticket status transition.",
    );
  }

  return prisma.$transaction(async (tx) => {
    // 2. Fetch the ticket within the actor's permitted scope.
    const scope = getTicketLifecycleScope(actor, action, ticketId);

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

    // 3. Check actor permission for this specific action.
    assertTicketLifecycleAccess(actor, action, {
      requesterId: ticket.requesterId,
      assigneeId: ticket.assigneeId,
      centerId: ticket.centerId,
    });

    // 4. Validate the state-machine transition.
    assertValidTicketTransition(ticket.status, nextStatus);

    // 5. ASSIGNED requires an eligible technician already assigned.
    if (
      nextStatus === TicketStatus.ASSIGNED &&
      ticket.assigneeId === null
    ) {
      throw new AppError(
        "CONFLICT",
        "A ticket must have an assigned technician before it can enter ASSIGNED status.",
      );
    }

    // 6. Update status and create history atomically.
    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        status: ticket.status,

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
        status: nextStatus,
      },
    });

    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket status or authorization changed before the update. Refresh and try again.",
      );
    }

    if (nextStatus === TicketStatus.WAITING_FOR_USER) {
      const pausedAt = new Date();

      const activeCycle = await tx.ticketSlaCycle.findFirst({
        where: {
          ticketId: ticket.id,
          resolvedAt: null,
        },
        orderBy: {
          cycleNumber: "desc",
        },
        select: {
          id: true,
          pausedAt: true,
        },
      });

      if (!activeCycle) {
        throw new AppError(
          "CONFLICT",
          "No active SLA cycle exists for this ticket.",
        );
      }

      if (activeCycle.pausedAt !== null) {
        throw new AppError(
          "CONFLICT",
          "The active SLA cycle is already paused.",
        );
      }

      const pauseResult = await tx.ticketSlaCycle.updateMany({
        where: {
          id: activeCycle.id,
          resolvedAt: null,
          pausedAt: null,
        },
        data: {
          pausedAt,
        },
      });

      if (pauseResult.count !== 1) {
        throw new AppError(
          "CONFLICT",
          "The SLA cycle changed before it could be paused. Refresh and try again.",
        );
      }
    }

    await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.STATUS_CHANGED,
        fromValue: ticket.status,
        toValue: nextStatus,
        description: `Ticket status changed from ${ticket.status} to ${nextStatus}.`,
      },
    });

    // 7. Notify the requester and assigned technician about the status change.
    const recipientIds: number[] = [ticket.requesterId];

    if (ticket.assigneeId !== null) {
      recipientIds.push(ticket.assigneeId);
    }

    await createNotifications(tx, {
      recipientIds,
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: "Ticket status updated",
      message: `Ticket #${ticket.id} status changed from ${ticket.status} to ${nextStatus}.`,
      ticketId: ticket.id,
    });

    // 8. Return the updated ticket with safe related data.
    return tx.ticket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketInclude,
    });
  });
}