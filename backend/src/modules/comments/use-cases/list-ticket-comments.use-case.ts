import {
  CommentVisibility,
  UserRole,
  Prisma,
} from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";
import type { AuthenticatedUser } from "../../../middleware/auth.middleware";

const commentInclude = {
  author: {
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  },
};

export async function listTicketComments(
  ticketId: number,
  actor: AuthenticatedUser,
) {
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
        "You are not authorized to view comments on this ticket.",
      );
  }

  // Verify ticket access first; do not reveal inaccessible ticket existence.
  const ticket = await prisma.ticket.findFirst({
    where: ticketScope,
    select: { id: true },
  });

  if (!ticket) {
    throw new AppError("NOT_FOUND", "Ticket not found.");
  }

  const visibilityFilter: Prisma.CommentWhereInput =
    actor.role === UserRole.EMPLOYEE
      ? { visibility: CommentVisibility.PUBLIC }
      : {};

  return prisma.comment.findMany({
    where: {
      ticketId: ticket.id,
      ...visibilityFilter,
    },
    include: commentInclude,
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" },
    ],
  });
}