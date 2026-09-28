import {
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";
import type {
  Prisma,
  PrismaClient,
} from "../../../generated/prisma/client";

import { AppError } from "../../../common/errors/app-error";

const CANCELLATION_REQUESTED =
  "CANCELLATION_REQUESTED";

const CANCELLATION_REJECTED =
  "CANCELLATION_REJECTED";

type TicketCancellationDb =
  | PrismaClient
  | Prisma.TransactionClient;


export async function getTicketCancellationInfo(
  db: TicketCancellationDb,
  ticketId: number,
  actor: {
    userId: number;
    role: UserRole;
  },
) {
  const history = await db.ticketHistory.findMany({
    where: {
      ticketId,
      OR: [
        {
          event: TicketHistoryEvent.STATUS_CHANGED,
          toValue: {
            in: [
              CANCELLATION_REQUESTED,
              CANCELLATION_REJECTED,
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
    take: 2,
    select: {
      id: true,
      event: true,
      fromValue: true,
      toValue: true,
      description: true,
      actorId: true,
      createdAt: true,

      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  const latest = history[0];

  if (!latest) {
    return {
      cancellation: null,
      cancellationRequest: null,
    };
  }

  /*
   * Final cancellation takes precedence.
   */
  if (
    latest.event === TicketHistoryEvent.CANCELLED &&
    latest.toValue === TicketStatus.CANCELLED
  ) {
    return {
      cancellation: {
        reason:
          latest.description ??
          "No cancellation reason was recorded.",
        cancelledAt: latest.createdAt,
        cancelledBy: latest.actor
          ? {
              id: latest.actor.id,
              fullName: latest.actor.fullName,
              role: latest.actor.role,
            }
          : null,
      },

      cancellationRequest: null,
    };
  }

  /*
   * Only Admin should see arbitrary manager cancellation
   * requests. A Center Manager can see their own request.
   */
  if (
    latest.toValue === CANCELLATION_REQUESTED
  ) {
    const canSeeRequest =
      actor.role === UserRole.ADMIN ||
      latest.actorId === actor.userId;

    if (!canSeeRequest) {
      return {
        cancellation: null,
        cancellationRequest: null,
      };
    }

    return {
      cancellation: null,

      cancellationRequest: {
        id: latest.id,
        status: "PENDING" as const,
        reason:
          latest.description ??
          "No cancellation reason was provided.",
        requestedAt: latest.createdAt,
        requestedBy: latest.actor
          ? {
              id: latest.actor.id,
              fullName: latest.actor.fullName,
              role: latest.actor.role,
            }
          : null,
        reviewedAt: null,
        reviewReason: null,
        reviewedBy: null,
      },
    };
  }

  /*
   * Latest entry is a rejection.
   */
  if (
    latest.toValue === CANCELLATION_REJECTED
  ) {
    /*
     * We need the request that preceded the rejection.
     */
    const originalRequest = history[1];

    const canSeeRequest =
      actor.role === UserRole.ADMIN ||
      originalRequest?.actorId === actor.userId;

    if (!canSeeRequest) {
      return {
        cancellation: null,
        cancellationRequest: null,
      };
    }

    return {
      cancellation: null,

      cancellationRequest: {
        id: originalRequest?.id ?? latest.id,
        status: "REJECTED" as const,
        reason:
          originalRequest?.description ??
          "No cancellation reason was provided.",
        requestedAt:
          originalRequest?.createdAt ??
          latest.createdAt,
        requestedBy: originalRequest?.actor
          ? {
              id: originalRequest.actor.id,
              fullName: originalRequest.actor.fullName,
              role: originalRequest.actor.role,
            }
          : null,
        reviewedAt: latest.createdAt,
        reviewReason:
          latest.description ??
          "No rejection reason was provided.",
        reviewedBy: latest.actor
          ? {
              id: latest.actor.id,
              fullName: latest.actor.fullName,
              role: latest.actor.role,
            }
          : null,
      },
    };
  }

  return {
    cancellation: null,
    cancellationRequest: null,
  };
}