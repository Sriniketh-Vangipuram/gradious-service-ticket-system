import {
  CommentVisibility,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../middleware/auth.middleware";
import type { CreateTicketCommentBody } from "../comment.schemas";
import type { Prisma } from "../../../generated/prisma/client";
import {
  addBusinessMinutes,
  getBusinessMinutesBetween,
} from "../../sla/business-calendar.service";

import { NotificationType } from "../../../generated/prisma/client";
import { createNotifications } from "../../notifications/notification.service";
import { publishToUser } from "../../../socket/socket.server";

const commentInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  },
};

export async function createTicketComment(
  ticketId: number,
  body: CreateTicketCommentBody,
  actor: AuthenticatedUser,
) {

  let statusChanged = false;
  let previousStatus: TicketStatus | null = null;
  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    // 1. Restrict the ticket lookup to tickets this actor may access.
    let ticketScope: Prisma.TicketWhereInput;

    switch (actor.role) {
      case UserRole.ADMIN:
        ticketScope = { id: ticketId };
        break;

      case UserRole.EMPLOYEE:
        ticketScope = {
          id: ticketId,
          requesterId: actor.userId,
        };
        break;

      case UserRole.TECHNICIAN:
        ticketScope = {
          id: ticketId,
          assigneeId: actor.userId,
        };
        break;

      case UserRole.CENTER_MANAGER:
        ticketScope = {
          id: ticketId,
          center: {
            userAccess: {
              some: { userId: actor.userId },
            },
          },
        };
        break;

      default:
        throw new AppError(
          "FORBIDDEN",
          "You are not authorized to comment on this ticket.",
        );
    }

    const ticket = await tx.ticket.findFirst({
      where: ticketScope,
      select: {
        id: true,
        ticketNumber:true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId:true,
      },
    });

    // Return 404 for inaccessible and nonexistent tickets.
    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    // 2. Employees may create public comments only.
    if (
      actor.role === UserRole.EMPLOYEE &&
      body.visibility === CommentVisibility.INTERNAL
    ) {
      throw new AppError(
        "FORBIDDEN",
        "Employees cannot create internal notes.",
      );
    }

    // 3. Persist the comment.
    const comment = await tx.comment.create({
      data: {
        ticketId: ticket.id,
        authorId: actor.userId,
        content: body.content,
        visibility: body.visibility,
      },
      include: commentInclude,
    });

    // 4. Record the first qualifying public staff response.
    // Only set it once; later comments must not overwrite it.
    const isPublicStaffResponse =
      actor.role !== UserRole.EMPLOYEE &&
      body.visibility === CommentVisibility.PUBLIC;

    if (isPublicStaffResponse) {
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

    // 5. A qualifying public requester reply resumes the ticket and SLA.
      const isPublicRequesterReply =
        actor.userId === ticket.requesterId &&
        actor.role === UserRole.EMPLOYEE &&
        body.visibility === CommentVisibility.PUBLIC;

      if (
        isPublicRequesterReply &&
        ticket.status === TicketStatus.WAITING_FOR_USER
      ) {
        const activeCycle = await tx.ticketSlaCycle.findFirst({
          where: {
            ticketId: ticket.id,
            resolvedAt: null,
            pausedAt:{
              not:null,
            },
          },
          orderBy: {
            cycleNumber: "desc",
          },
          select: {
            id: true,
            dueAt: true,
            pausedAt: true,
            totalPausedMinutes: true,
          },
        });

        if (!activeCycle || activeCycle.pausedAt === null) {
          throw new AppError(
            "CONFLICT",
            "The active SLA cycle is missing or is not paused.",
          );
        }

        previousStatus = ticket.status;
        const ticketUpdateResult = await tx.ticket.updateMany({
          where: {
            id: ticket.id,
            requesterId: actor.userId,
            status: TicketStatus.WAITING_FOR_USER,
          },
          data: {
            status: TicketStatus.IN_PROGRESS,
          },
        });

        if (ticketUpdateResult.count !== 1) {
          throw new AppError(
            "CONFLICT",
            "Ticket status changed before the reply could resume it. Please refresh and try again.",
          );
        }

        statusChanged = true;

        // Use the persisted comment timestamp as the resume instant.
        const resumedAt = comment.createdAt;

        const pausedBusinessMinutes = await getBusinessMinutesBetween({
          startAt: activeCycle.pausedAt,
          endAt: resumedAt,
          centerId: ticket.centerId,
          db: tx,
        });

        const pausedMinutesToPersist = Math.round(pausedBusinessMinutes);

        // Extend the existing deadline by the business time spent paused.
        const resumedDueAt = await addBusinessMinutes({
          startAt: activeCycle.dueAt,
          businessMinutes: pausedMinutesToPersist,
          centerId: ticket.centerId,
          db: tx,
        });

        const cycleUpdateResult = await tx.ticketSlaCycle.updateMany({
          where: {
            id: activeCycle.id,
            resolvedAt: null,
            pausedAt: activeCycle.pausedAt,
          },
          data: {
            dueAt: resumedDueAt,
            pausedAt: null,
            totalPausedMinutes: {
              increment: pausedMinutesToPersist,
            },
          },
        });

        if (cycleUpdateResult.count !== 1) {
          throw new AppError(
            "CONFLICT",
            "The SLA cycle changed before it could be resumed. Refresh and try again.",
          );
        }

        await tx.ticket.update({
          where: {
            id: ticket.id,
          },
          data: {
            resolutionDueAt: resumedDueAt,
          },
        });

        await tx.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            event: TicketHistoryEvent.STATUS_CHANGED,
            fromValue: TicketStatus.WAITING_FOR_USER,
            toValue: TicketStatus.IN_PROGRESS,
            actorId: actor.userId,
            description:
              "Ticket resumed after a public requester reply.",
          },
        });

        // Notify the assigned technician that the requester has responded.
        if (ticket.assigneeId !== null) {
          createdNotifications = await createNotifications(tx, {
            recipientIds: [ticket.assigneeId],
            type: NotificationType.TICKET_STATUS_CHANGED,
            title: "Employee responded to your query",
            message: `The requester has replied to ticket ${ticket.ticketNumber}. The ticket is now IN_PROGRESS.`,
            ticketId: ticket.id,
            dedupeKey: `ticket:${ticket.id}:requester-reply:comment:${comment.id}`,
          });
      }
      }

      // // Notify the assigned technician that the requester has responded.
      // if (ticket.assigneeId !== null) {
      //   createdNotifications = await createNotifications(tx, {
      //     recipientIds: [ticket.assigneeId],
      //     type: NotificationType.TICKET_STATUS_CHANGED,
      //     title: "Employee responded to your query",
      //     message: `The requester has replied to ticket ${ticket.ticketNumber}. The ticket is now IN_PROGRESS.`,
      //     ticketId: ticket.id,
      //     dedupeKey: `ticket:${ticket.id}:requester-reply:comment:${comment.id}`,
      //   });
      // }

    const recipientIds: number[] = [];

    if (body.visibility === CommentVisibility.PUBLIC) {
      recipientIds.push(ticket.requesterId);

      if (ticket.assigneeId !== null) {
        recipientIds.push(ticket.assigneeId);
      }
    } else {
      // INTERNAL comments must never be delivered to the requester.
      if (ticket.assigneeId !== null) {
        recipientIds.push(ticket.assigneeId);
      }
    }

    return {
      comment,
      recipientIds: [...new Set(recipientIds)],
      statusChanged,
      previousStatus,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        centerId: ticket.centerId,
      },
    };
  });

  for (const userId of result.recipientIds) {
    publishToUser(userId, "ticket:comment_created", {
      ticketId: result.ticket.id,
      ticketNumber: result.ticket.ticketNumber,
      centerId: result.ticket.centerId,
      comment: {
        id: result.comment.id,
        author: result.comment.author,
        content: result.comment.content,
        visibility: result.comment.visibility,
        createdAt: result.comment.createdAt,
      },
    });
  }

  if (result.statusChanged && result.previousStatus !== null) {
    for (const userId of result.recipientIds) {
      publishToUser(userId, "ticket:status_changed", {
        ticketId: result.ticket.id,
        centerId: result.ticket.centerId,
        previousStatus: result.previousStatus,
        status: TicketStatus.IN_PROGRESS,
        updatedAt: result.comment.createdAt,
      });
    }
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

  return result.comment;
}