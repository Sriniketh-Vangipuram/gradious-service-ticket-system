import type { Prisma } from "../../../generated/prisma/client";

import type {
  ListSlaTicketsQuery,
} from "../sla.schemas";

import type {
  SlaMonitoringActor,
} from "./sla-monitoring.types";

export function buildTicketScope(
  actor: SlaMonitoringActor,
  query: ListSlaTicketsQuery,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (actor.role === "EMPLOYEE") {
    where.requesterId = actor.userId;
  }

  if (actor.role === "TECHNICIAN") {
    where.assigneeId = actor.userId;
  }

  if (actor.role === "CENTER_MANAGER") {
    where.center = {
      userAccess: {
        some: {
          userId: actor.userId,
        },
      },
    };
  }

  if (query.priority !== undefined) {
    where.priority = query.priority;
  }

  if (query.ticketStatus !== undefined) {
    where.status = query.ticketStatus;
  }

  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  if (query.assigneeId !== undefined) {
    where.assigneeId = query.assigneeId;
  }

  if (query.centerId !== undefined) {
    if (actor.role === "CENTER_MANAGER") {
      where.center = {
        userAccess: {
          some: {
            userId: actor.userId,
            centerId: query.centerId,
          },
        },
      };
    } else {
      where.centerId = query.centerId;
    }
  }

  return where;
}

export function buildSlaOverviewScope(
  actor: SlaMonitoringActor,
  centerId?: number,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};

  if (actor.role === "EMPLOYEE") {
    where.requesterId = actor.userId;
  }

  if (actor.role === "TECHNICIAN") {
    where.assigneeId = actor.userId;
  }

  if (actor.role === "CENTER_MANAGER") {
    where.center = {
      userAccess: {
        some: {
          userId: actor.userId,
          ...(centerId !== undefined
            ? {
                centerId,
              }
            : {}),
        },
      },
    };

    return where;
  }

  if (centerId !== undefined) {
    where.centerId = centerId;
  }

  return where;
}