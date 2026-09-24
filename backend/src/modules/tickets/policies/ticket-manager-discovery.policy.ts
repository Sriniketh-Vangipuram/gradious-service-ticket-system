import { UserRole } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { AppError } from "../../../common/errors/app-error";

export type TicketManagerDiscoveryActor = {
  userId: number;
  role: string;
};

export function buildTicketManagerDiscoveryScope(
  ticketId: number,
  actor: TicketManagerDiscoveryActor,
): Prisma.TicketWhereInput {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only administrators can view eligible center managers.",
    );
  }

  return {
    id: ticketId,
  };
}