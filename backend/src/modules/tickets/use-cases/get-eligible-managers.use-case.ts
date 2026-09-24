import { UserRole } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";

import type { TicketManagerDiscoveryActor } from "../policies/ticket-manager-discovery.policy";
import { buildTicketManagerDiscoveryScope } from "../policies/ticket-manager-discovery.policy";

export async function getEligibleManagersUseCase(
  ticketId: number,
  actor: TicketManagerDiscoveryActor,
) {
  const ticket = await prisma.ticket.findFirst({
    where: buildTicketManagerDiscoveryScope(
      ticketId,
      actor,
    ),
    select: {
      id: true,
      centerId: true,
    },
  });

  if (!ticket) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      role: UserRole.CENTER_MANAGER,
      isActive: true,
      centerAccess: {
        some: {
          centerId: ticket.centerId,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });
}