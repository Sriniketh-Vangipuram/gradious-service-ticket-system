import {
  CommentVisibility,
  NotificationType,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";

import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../middleware/auth.middleware";

import { publishToUser } from "../../../socket/socket.server";

import {
  assertValidTicketTransition,
} from "../policies/ticket-transition.policy";

import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../policies/ticket-lifecycle-access.policy";

import { createNotifications } from "../../notifications/notification.service";
import { createAuditLog } from "../../audit/audit.service";

import type { RequestInformationBody } from "../ticket.schemas";

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

const commentInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  },
} satisfies Prisma.CommentInclude;

export async function requestInformationUseCase(
  ticketId: number,
  body: RequestInformationBody,
  actor: AuthenticatedUser,
) {
  const content = body.comment.trim();

  if (!content) {
    throw new AppError(
      "VALIDATION_ERROR",
      "A comment explaining the required information is required.",
    );
  }

  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(
    async (tx) => {
      /*
       * 1. This operation is specifically for technicians
       *    requesting information from the requester.
       */
      const scope = getTicketLifecycleScope(
        actor,
        "WAIT_FOR_USER",
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
          firstResponseAt: true,
        },
      });

      if (!ticket) {
        throw new AppError(
          "NOT_FOUND",
          "Ticket not found.",
        );
      }

      /*
       * 2. Verify the actor can perform WAIT_FOR_USER.
       */
      assertTicketLifecycleAccess(
        actor,
        "WAIT_FOR_USER",
        {
          requesterId: ticket.requesterId,
          assigneeId: ticket.assigneeId,
          centerId: ticket.centerId,
        },
      );

      /*
       * 3. Explicitly require IN_PROGRESS.
       *
       * Request Information is not an ordinary arbitrary
       * status update. It represents a specific lifecycle action.
       */
      if (ticket.status !== TicketStatus.IN_PROGRESS) {
        throw new AppError(
          "CONFLICT",
          "Information can only be requested while the ticket is in progress.",
        );
      }

      /*
       * 4. Validate the state-machine transition.
       */
      assertValidTicketTransition(
        ticket.status,
        TicketStatus.WAITING_FOR_USER,
      );

      /*
       * 5. Create the PUBLIC comment inside the same
       *    transaction as the status change.
       *
       *    This is important: we never want the ticket to become
       *    WAITING_FOR_USER without the explanation being saved.
       */
      const comment = await tx.comment.create({
        data: {
          ticketId: ticket.id,
          authorId: actor.userId,
          content,
          visibility: CommentVisibility.PUBLIC,
        },
        include: commentInclude,
      });

      /*
       * 6. A public technician response qualifies as the
       *    first response when one has not already been recorded.
       */
      if (ticket.firstResponseAt === null) {
        await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            firstResponseAt: null,
          },
          data: {
            firstResponseAt: comment.createdAt,
          },
        });
      }

      /*
       * 7. Atomically move the ticket to WAITING_FOR_USER.
       */
      const updateResult = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          status: TicketStatus.IN_PROGRESS,
          assigneeId: actor.userId,
        },
        data: {
          status: TicketStatus.WAITING_FOR_USER,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError(
          "CONFLICT",
          "Ticket status or authorization changed before the information request could be completed. Refresh and try again.",
        );
      }

      /*
       * 8. Pause the active SLA cycle.
       */
      const pausedAt = new Date();

      const activeCycle =
        await tx.ticketSlaCycle.findFirst({
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

      const pauseResult =
        await tx.ticketSlaCycle.updateMany({
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

      /*
       * 9. Record the lifecycle transition.
       */
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          actorId: actor.userId,
          event: TicketHistoryEvent.STATUS_CHANGED,
          fromValue: TicketStatus.IN_PROGRESS,
          toValue: TicketStatus.WAITING_FOR_USER,
          description:
            "Technician requested additional information from the requester.",
        },
      });

      /*
       * 10. Audit the complete lifecycle action.
       */
      await createAuditLog(
        {
          action: "TICKET_STATUS_CHANGED",
          entityType: "TICKET",
          entityId: String(ticket.id),
          actorId: actor.userId,
          oldValue: {
            status: TicketStatus.IN_PROGRESS,
          },
          newValue: {
            status: TicketStatus.WAITING_FOR_USER,
          },
          metadata: {
            lifecycleAction: "WAIT_FOR_USER",
            ticketNumber: ticket.ticketNumber,
            commentId: comment.id,
          },
        },
        tx,
      );

      /*
       * 11. Notify the requester that information is required.
       */
      const requesterNotifications =
        await createNotifications(tx, {
          recipientIds: [ticket.requesterId],
          type: NotificationType.TICKET_STATUS_CHANGED,
          title: "Additional information required",
          message: `The technician requested additional information for ticket ${ticket.ticketNumber}: ${content}`,
          ticketId: ticket.id,
        });

      createdNotifications =
        requesterNotifications;

      /*
       * 12. Return everything needed by the frontend.
       */
      return {
        ticket: await tx.ticket.findUniqueOrThrow({
          where: {
            id: ticket.id,
          },
          include: ticketInclude,
        }),
        comment,
        previousStatus: TicketStatus.IN_PROGRESS,
      };
    },
    {
      maxWait: 5000,
      timeout: 15000,
    },
  );

  /*
   * 13. Publish realtime events only after the transaction
   *     has successfully committed.
   */

  const recipientIds = [
    result.ticket.requesterId,
    result.ticket.assigneeId,
  ].filter(
    (userId): userId is number => userId !== null,
  );

  for (const userId of [
    ...new Set(recipientIds),
  ]) {
    publishToUser(
      userId,
      "ticket:status_changed",
      {
        ticketId: result.ticket.id,
        centerId: result.ticket.centerId,
        previousStatus:
          result.previousStatus,
        status: result.ticket.status,
        updatedAt: result.ticket.updatedAt,
      },
    );
  }

  publishToUser(
    result.comment.author.id,
    "ticket:comment_created",
    {
      ticketId: result.ticket.id,
      comment: result.comment,
    },
  );

  for (const notification of createdNotifications) {
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

  return {
    ticket: result.ticket,
    comment: result.comment,
  };
}