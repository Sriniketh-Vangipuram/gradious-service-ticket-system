import {
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../common/errors/app-error";

export type TicketUpdateActor = {
  userId: number;
  role: UserRole;
};

export function buildTicketUpdateScope(
  ticketId: number,
  actor: TicketUpdateActor,
): Prisma.TicketWhereInput {
  switch (actor.role) {
    case UserRole.ADMIN:
      return {
        id: ticketId,
      };

    case UserRole.EMPLOYEE:
      return {
        id: ticketId,
        requesterId: actor.userId,
        status: TicketStatus.OPEN,
      };

    case UserRole.TECHNICIAN:
      return {
        id: ticketId,
        assigneeId: actor.userId,
      };

    case UserRole.CENTER_MANAGER:
      return {
        id: ticketId,
        center: {
          userAccess: {
            some: {
              userId: actor.userId,
            },
          },
        },
      };

    default:
      throw new AppError(
        "FORBIDDEN",
        "You are not allowed to update tickets.",
      );
  }
}