import { UserRole } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { AppError } from "../../../common/errors/app-error";

export type TicketManagerAssignmentActor = {
  userId: number;
  role: UserRole;
};

export function buildTicketManagerAssignmentScope(
  ticketId: number,
  actor: TicketManagerAssignmentActor,
): Prisma.TicketWhereInput {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only administrators can assign a center manager to a ticket.",
    );
  }

  return {
    id: ticketId,
  };
}