import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";

import {
  calculateFirstResponseMonitoring,
  calculateResolutionMonitoring,
} from "./sla-monitoring.calculator";

import {
  buildTicketScope,
} from "./sla-monitoring.scope";

import type {
  ListSlaTicketsQuery,
} from "../sla.schemas";

import type {
  BusinessMinutesCache,
  SlaMonitoringActor,
  SlaMonitoringTicketRecord,
  SlaTicketMonitoringItem,
} from "./sla-monitoring.types";

function matchesDerivedFilters(
  item: SlaTicketMonitoringItem,
  query: ListSlaTicketsQuery,
): boolean {
  if (
    query.firstResponseStatus !== undefined &&
    item.firstResponse.status !==
      query.firstResponseStatus
  ) {
    return false;
  }

  if (
    query.resolutionStatus !== undefined &&
    item.resolution.status !==
      query.resolutionStatus
  ) {
    return false;
  }

  if (
    query.paused !== undefined &&
    (item.resolution.status === "PAUSED") !==
      query.paused
  ) {
    return false;
  }

  return true;
}

async function buildMonitoringItem(
  ticket: SlaMonitoringTicketRecord,
  now: Date,
  businessMinutesCache: BusinessMinutesCache,
): Promise<SlaTicketMonitoringItem> {
  const firstResponse =
    await calculateFirstResponseMonitoring(
      ticket,
      now,
      businessMinutesCache,
    );

  const resolution =
    await calculateResolutionMonitoring(
      ticket,
      now,
      businessMinutesCache,
    );

  return {
    id: ticket.id,

    ticketNumber: ticket.ticketNumber,

    title: ticket.title,

    status: ticket.status,

    priority: ticket.priority,

    center: {
      id: ticket.center.id,
      name: ticket.center.name,
      code: ticket.center.code,
    },

    category: {
      id: ticket.category.id,
      name: ticket.category.name,
      code: ticket.category.code,
    },

    requester: {
      id: ticket.requester.id,
      fullName: ticket.requester.fullName,
    },

    assignee:
      ticket.assignee === null
        ? null
        : {
            id: ticket.assignee.id,
            fullName:
              ticket.assignee.fullName,
          },

    firstResponse,

    resolution,
  };
}

export async function listSlaTickets(
  actor: SlaMonitoringActor,
  query: ListSlaTicketsQuery,
  now: Date = new Date(),
) {
  const where = buildTicketScope(
    actor,
    query,
  );

  const batchSize = Math.max(
    query.limit * 2,
    50,
  );

  const businessMinutesCache =
    new Map<string, number>();

  const items: SlaTicketMonitoringItem[] = [];

  let cursorId = query.cursor;

  let hasMoreDatabaseRecords = true;

  while (
    items.length < query.limit &&
    hasMoreDatabaseRecords
  ) {
    const tickets =
      await prisma.ticket.findMany({
        where,

        orderBy: {
          id: "desc",
        },

        take: batchSize,

        ...(cursorId !== undefined
          ? {
              cursor: {
                id: cursorId,
              },
              skip: 1,
            }
          : {}),

        select: {
          id: true,

          ticketNumber: true,

          title: true,

          status: true,

          priority: true,

          centerId: true,

          firstResponseAt: true,

          firstResponseDueAt: true,

          firstResponseTargetMinutes: true,

          atRiskThresholdPercent: true,

          center: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          category: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          requester: {
            select: {
              id: true,
              fullName: true,
            },
          },

          assignee: {
            select: {
              id: true,
              fullName: true,
            },
          },

          slaCycles: {
            orderBy: {
              cycleNumber: "desc",
            },

            take: 1,

            select: {
              id: true,

              cycleNumber: true,

              startedAt: true,

              dueAt: true,

              targetMinutes: true,

              resolvedAt: true,

              outcome: true,

              pausedAt: true,

              totalPausedMinutes: true,

              atRiskThresholdPercent: true,
            },
          },
        },
      });

    if (tickets.length === 0) {
      hasMoreDatabaseRecords = false;
      break;
    }

    for (const ticket of tickets) {
      const monitoringItem =
        await buildMonitoringItem(
          ticket,
          now,
          businessMinutesCache,
        );

      if (
        matchesDerivedFilters(
          monitoringItem,
          query,
        )
      ) {
        items.push(monitoringItem);

        if (items.length >= query.limit) {
          break;
        }
      }
    }

    const lastTicket =
      tickets[tickets.length - 1];

    if (!lastTicket) {
      hasMoreDatabaseRecords = false;
      break;
    }

    cursorId = lastTicket.id;

    if (tickets.length < batchSize) {
      hasMoreDatabaseRecords = false;
    }
  }

  return {
    items,

    pagination: {
      hasNextPage: hasMoreDatabaseRecords,

      nextCursor: hasMoreDatabaseRecords
        ? cursorId ?? null
        : null,
    },
  };
}