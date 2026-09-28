import { UserRole } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { AppError } from "../../../common/errors/app-error";

export type TicketTechnicianAssignmentActor = {
  userId: number;
  role: UserRole;
};

export function buildTicketTechnicianAssignmentScope(
  ticketId: number,
  actor: TicketTechnicianAssignmentActor,
): Prisma.TicketWhereInput {
  if (actor.role !== UserRole.CENTER_MANAGER) {
    throw new AppError(
      "FORBIDDEN",
      "Only center managers can assign technicians to tickets.",
    );
  }

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
}