import {
  TechnicianSpecialization,
  UserRole,
} from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { TicketAssignmentActor } from "../policies/ticket-assignment-scope.policy";
import { buildTicketAssignmentScope } from "../policies/ticket-assignment-scope.policy";

export async function getEligibleTechniciansUseCase(
  ticketId: number,
  actor: TicketAssignmentActor,
) {
  /*
   * The same scope used by assignment mutation is used here.
   *
   * This guarantees:
   *
   * discovery authorization === assignment authorization
   */
  const ticket = await prisma.ticket.findFirst({
    where: buildTicketAssignmentScope(ticketId, actor),
    select: {
      id: true,
      centerId: true,
    },
  });

  if (!ticket) {
    throw new AppError(
      "NOT_FOUND",
      "Ticket not found.",
    );
  }

  const technicians = await prisma.user.findMany({
    where: {
      role: UserRole.TECHNICIAN,
      isActive: true,

      /*
       * A technician is eligible for this ticket only when
       * they have explicit authorization for the ticket's center.
       */
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

      specializations: {
        select: {
          specialization: true,
        },
        orderBy: {
          specialization: "asc",
        },
      },
    },

    orderBy: [
      {
        fullName: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  return {
    technicians: technicians.map((technician) => ({
      id: technician.id,
      fullName: technician.fullName,
      email: technician.email,
      specializations: technician.specializations.map(
        ({ specialization }) => specialization,
      ),
    })),
  };
}