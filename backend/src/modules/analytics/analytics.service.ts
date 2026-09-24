import {
  Prisma,
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import type {
  AnalyticsQuery,
  BreakdownResult,
  PriorityBreakdownResult,
  ResolutionRateResult,
  SlaComplianceResult,
  TechnicianWorkloadResult,
  TicketTrendPoint,
  TicketVolumeResult,
  TimeMetricResult,
} from "./analytics.types";

function buildTicketWhere(
  query: AnalyticsQuery,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {
    createdAt: {
      gte: query.from,
      lte: query.to,
    },
  };

  if (query.centerId !== undefined) {
    where.centerId = query.centerId;
  }

  if (query.categoryId !== undefined) {
    where.categoryId = query.categoryId;
  }

  if (query.priority !== undefined) {
    where.priority = query.priority;
  }

  if (query.scope.role === "CENTER_MANAGER") {
    where.centerId = {
      in: query.scope.centerIds ?? [],
    };

    if (query.centerId !== undefined) {
      where.centerId = {
        in: (query.scope.centerIds ?? []).includes(query.centerId)
          ? [query.centerId]
          : [],
      };
    }
  }

  return where;
}

/**
 * Ticket volume
 */
export async function getTicketVolume(
  query: AnalyticsQuery,
): Promise<TicketVolumeResult> {
  const where = buildTicketWhere(query);

  const [total, grouped] = await Promise.all([
    prisma.ticket.count({
      where,
    }),

    prisma.ticket.groupBy({
      by: ["status"],
      where,
      _count: {
        _all: true,
      },
    }),
  ]);

  return {
    total,
    byStatus: grouped.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
  };
}

/**
 * Ticket trends
 *
 * MySQL date functions are used here because Prisma's
 * groupBy cannot directly group DateTime by day/week/month.
 */
export async function getTicketTrends(
  query: AnalyticsQuery,
): Promise<TicketTrendPoint[]> {
  const where = buildTicketWhere(query);

  const conditions: Prisma.Sql[] = [
    Prisma.sql`"createdAt" >= ${query.from}`,
    Prisma.sql`"createdAt" <= ${query.to}`,
  ];

  if (where.centerId !== undefined) {
    if (typeof where.centerId === "number") {
      conditions.push(
        Prisma.sql`centerId = ${where.centerId}`,
      );
    } else if (
      typeof where.centerId === "object" &&
      "in" in where.centerId
    ) {
      conditions.push(
        Prisma.sql`centerId IN (${Prisma.join(
          where.centerId.in ?? [],
        )})`,
      );
    }
  }

  if (query.categoryId !== undefined) {
    conditions.push(
      Prisma.sql`categoryId = ${query.categoryId}`,
    );
  }

  if (query.priority !== undefined) {
    conditions.push(
      Prisma.sql`priority = ${query.priority}`,
    );
  }

  let dateExpression: Prisma.Sql;

  switch (query.granularity) {
    case "month":
      dateExpression = Prisma.sql`
        DATE_FORMAT(createdAt, '%Y-%m')
      `;
      break;

    case "week":
      dateExpression = Prisma.sql`
        DATE_FORMAT(createdAt, '%x-W%v')
      `;
      break;

    case "day":
    default:
      dateExpression = Prisma.sql`
        DATE_FORMAT(createdAt, '%Y-%m-%d')
      `;
      break;
  }

  const result = await prisma.$queryRaw<
    Array<{
      period: string;
      count: bigint;
    }>
  >(
    Prisma.sql`
      SELECT
        ${dateExpression} AS period,
        COUNT(*) AS count
      FROM Ticket
      WHERE ${Prisma.join(conditions, " AND ")}
      GROUP BY ${dateExpression}
      ORDER BY ${dateExpression} ASC
    `,
  );

  return result.map((item) => ({
    period: item.period,
    count: Number(item.count),
  }));
}

/**
 * Tickets by center
 */
export async function getTicketsByCenter(
  query: AnalyticsQuery,
): Promise<BreakdownResult[]> {
  const where = buildTicketWhere(query);

  const grouped = await prisma.ticket.groupBy({
    by: ["centerId"],
    where,
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  if (grouped.length === 0) {
    return [];
  }

  const centers = await prisma.center.findMany({
    where: {
      id: {
        in: grouped.map((item) => item.centerId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const centerMap = new Map(
    centers.map((center) => [
      center.id,
      center.name,
    ]),
  );

  return grouped.map((item) => ({
    id: item.centerId,
    name: centerMap.get(item.centerId) ?? "Unknown",
    count: item._count._all,
  }));
}

/**
 * Tickets by category
 */
export async function getTicketsByCategory(
  query: AnalyticsQuery,
): Promise<BreakdownResult[]> {
  const where = buildTicketWhere(query);

  const grouped = await prisma.ticket.groupBy({
    by: ["categoryId"],
    where,
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  if (grouped.length === 0) {
    return [];
  }

  const categories = await prisma.category.findMany({
    where: {
      id: {
        in: grouped.map((item) => item.categoryId),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const categoryMap = new Map(
    categories.map((category) => [
      category.id,
      category.name,
    ]),
  );

  return grouped.map((item) => ({
    id: item.categoryId,
    name:
      categoryMap.get(item.categoryId) ?? "Unknown",
    count: item._count._all,
  }));
}

/**
 * Tickets by priority
 */
export async function getTicketsByPriority(
  query: AnalyticsQuery,
): Promise<PriorityBreakdownResult[]> {
  const where = buildTicketWhere(query);

  const grouped = await prisma.ticket.groupBy({
    by: ["priority"],
    where,
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  return grouped.map((item) => ({
    priority: item.priority,
    count: item._count._all,
  }));
}

/**
 * SLA compliance
 *
 * CANCELLED cycles are excluded.
 * Compliance =
 * MET / (MET + BREACHED) * 100
 */
export async function getSlaCompliance(
  query: AnalyticsQuery,
): Promise<SlaComplianceResult> {
  const ticketWhere = buildTicketWhere(query);

  const cycles = await prisma.ticketSlaCycle.findMany({
    where: {
      ticket: ticketWhere,
      outcome: {
        in: ["MET", "BREACHED"],
      },
    },
    select: {
      outcome: true,
    },
  });

  const met = cycles.filter(
    (cycle) => cycle.outcome === "MET",
  ).length;

  const breached = cycles.filter(
    (cycle) => cycle.outcome === "BREACHED",
  ).length;

  const totalCompleted = met + breached;

  return {
    totalCompleted,
    met,
    breached,
    complianceRate:
      totalCompleted === 0
        ? 0
        : Number(
            ((met / totalCompleted) * 100).toFixed(2),
          ),
  };
}

/**
 * Average first-response time
 */
export async function getAverageResponseTime(
  query: AnalyticsQuery,
): Promise<TimeMetricResult> {
  const where = buildTicketWhere(query);

  const tickets = await prisma.ticket.findMany({
    where: {
      ...where,
      firstResponseAt: {
        not: null,
      },
    },
    select: {
      createdAt: true,
      firstResponseAt: true,
    },
  });

  if (tickets.length === 0) {
    return {
      averageMinutes: null,
      sampleSize: 0,
    };
  }

  const totalMinutes = tickets.reduce(
    (total, ticket) => {
      const responseAt = ticket.firstResponseAt!;

      return (
        total +
        (responseAt.getTime() -
          ticket.createdAt.getTime()) /
          60000
      );
    },
    0,
  );

  return {
    averageMinutes: Number(
      (totalMinutes / tickets.length).toFixed(2),
    ),
    sampleSize: tickets.length,
  };
}

/**
 * Average resolution time
 */
export async function getAverageResolutionTime(
  query: AnalyticsQuery,
): Promise<TimeMetricResult> {
  const where = buildTicketWhere(query);

  const tickets = await prisma.ticket.findMany({
    where: {
      ...where,
      resolvedAt: {
        not: null,
      },
    },
    select: {
      createdAt: true,
      resolvedAt: true,
    },
  });

  if (tickets.length === 0) {
    return {
      averageMinutes: null,
      sampleSize: 0,
    };
  }

  const totalMinutes = tickets.reduce(
    (total, ticket) => {
      const resolvedAt = ticket.resolvedAt!;

      return (
        total +
        (resolvedAt.getTime() -
          ticket.createdAt.getTime()) /
          60000
      );
    },
    0,
  );

  return {
    averageMinutes: Number(
      (totalMinutes / tickets.length).toFixed(2),
    ),
    sampleSize: tickets.length,
  };
}

/**
 * Technician workload
 */
export async function getTechnicianWorkload(
  query: AnalyticsQuery,
): Promise<TechnicianWorkloadResult[]> {
  const ticketWhere = buildTicketWhere(query);

  const technicians = await prisma.user.findMany({
    where: {
      role: "TECHNICIAN",
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

  const results = await Promise.all(
    technicians.map(async (technician) => {
      const assignedWhere: Prisma.TicketWhereInput = {
        ...ticketWhere,
        assigneeId: technician.id,
      };

      const [
        assignedTickets,
        activeTickets,
        resolvedTickets,
      ] = await Promise.all([
        prisma.ticket.count({
          where: assignedWhere,
        }),

        prisma.ticket.count({
          where: {
            ...assignedWhere,
            status: {
              in: [
                TicketStatus.ASSIGNED,
                TicketStatus.IN_PROGRESS,
                TicketStatus.WAITING_FOR_USER,
              ],
            },
          },
        }),

        prisma.ticket.count({
          where: {
            ...assignedWhere,
            status: {
              in: [
                TicketStatus.RESOLVED,
                TicketStatus.CLOSED,
              ],
            },
          },
        }),
      ]);

      return {
        technicianId: technician.id,
        technicianName: technician.fullName,
        assignedTickets,
        activeTickets,
        resolvedTickets,
      };
    }),
  );

  return results.filter(
    (technician) =>
      technician.assignedTickets > 0,
  );
}

/**
 * Resolution rate
 *
 * Denominator:
 * all tickets created within the selected
 * analytics period and scope.
 *
 * Numerator:
 * tickets resolved within that same period.
 */
export async function getResolutionRate(
  query: AnalyticsQuery,
): Promise<ResolutionRateResult> {
  const where = buildTicketWhere(query);

  const [totalTickets, resolvedTickets] =
    await Promise.all([
      prisma.ticket.count({
        where,
      }),

      prisma.ticket.count({
        where: {
          ...where,
          resolvedAt: {
            not: null,
            gte: query.from,
            lte: query.to,
          },
        },
      }),
    ]);

  return {
    totalTickets,
    resolvedTickets,
    resolutionRate:
      totalTickets === 0
        ? 0
        : Number(
            (
              (resolvedTickets / totalTickets) *
              100
            ).toFixed(2),
          ),
  };
}