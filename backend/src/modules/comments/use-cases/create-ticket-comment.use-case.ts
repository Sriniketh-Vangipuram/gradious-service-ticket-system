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
  return prisma.$transaction(async (tx) => {
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
        status: true,
        requesterId: true,
        assigneeId: true,
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

    // 4. A public requester reply resumes a ticket awaiting the user.
    const isPublicRequesterReply =
      actor.userId === ticket.requesterId &&
      actor.role === UserRole.EMPLOYEE &&
      body.visibility === CommentVisibility.PUBLIC;

    if (
      isPublicRequesterReply &&
      ticket.status === TicketStatus.WAITING_FOR_USER
    ) {
      const updateResult = await tx.ticket.updateMany({
        where: {
          id: ticket.id,
          requesterId: actor.userId,
          status: TicketStatus.WAITING_FOR_USER,
        },
        data: {
          status: TicketStatus.IN_PROGRESS,
        },
      });

      if (updateResult.count !== 1) {
        throw new AppError(
          "CONFLICT",
          "Ticket status changed before the reply could resume it. Please refresh and try again.",
        );
      }

      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          event: TicketHistoryEvent.STATUS_CHANGED,
          fromValue: TicketStatus.WAITING_FOR_USER,
          toValue: TicketStatus.IN_PROGRESS,
          actorId: actor.userId,
          description: "Ticket resumed after a public requester reply.",
        },
      });
    }

    return comment;
  });
}