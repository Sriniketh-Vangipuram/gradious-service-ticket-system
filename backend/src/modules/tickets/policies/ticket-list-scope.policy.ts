import { UserRole } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../../../common/errors/app-error";

export type TicketListActor = {
  userId: number;
  role: string;
};

export function buildTicketListScope(
  actor: TicketListActor,
): Prisma.TicketWhereInput {
  switch (actor.role) {
    case UserRole.ADMIN:
      return {};

    case UserRole.EMPLOYEE:
      return {
        requesterId: actor.userId,
      };

    case UserRole.TECHNICIAN:
      return {
        assigneeId: actor.userId,
      };

    case UserRole.CENTER_MANAGER:
      return {
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
        "You are not allowed to view tickets.",
      );
  }
}