import {
  TicketStatus,
} from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";

import {
  calculateFirstResponseMonitoring,
  calculateResolutionMonitoring,
} from "./sla-monitoring.calculator";

import {
  buildSlaOverviewScope,
} from "./sla-monitoring.scope";

import type {
  BusinessMinutesCache,
  SlaMonitoringActor,
  SlaOverview,
} from "./sla-monitoring.types";

export async function getSlaOverview(
  actor: SlaMonitoringActor,
  centerId?: number,
  now: Date = new Date(),
): Promise<SlaOverview> {
  const where =
    buildSlaOverviewScope(
      actor,
      centerId,
    );

  const tickets =
    await prisma.ticket.findMany({
      where,

      select: {
        id: true,

        status: true,

        centerId: true,

        firstResponseAt: true,

        firstResponseDueAt: true,

        firstResponseTargetMinutes: true,

        atRiskThresholdPercent: true,

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

  const overview: SlaOverview = {
    tickets: {
      active: 0,
      paused: 0,
      dueSoon: 0,
      overdue: 0,
    },

    firstResponse: {
      pending: 0,
      atRisk: 0,
      overdue: 0,
      met: 0,
    },

    resolution: {
      pending: 0,
      atRisk: 0,
      paused: 0,
      overdue: 0,
      met: 0,
      breached: 0,
      cancelled: 0,
    },
  };

  const businessMinutesCache: BusinessMinutesCache =
    new Map();

  for (const ticket of tickets) {
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

    const isTerminal =
      ticket.status ===
        TicketStatus.RESOLVED ||
      ticket.status ===
        TicketStatus.CLOSED ||
      ticket.status ===
        TicketStatus.CANCELLED;

    if (!isTerminal) {
      overview.tickets.active += 1;
    }

    if (
      resolution.status === "PAUSED"
    ) {
      overview.tickets.paused += 1;
    }

    if (
      firstResponse.status === "AT_RISK" ||
      resolution.status === "AT_RISK"
    ) {
      overview.tickets.dueSoon += 1;
    }

    if (
      firstResponse.status === "OVERDUE" ||
      resolution.status === "OVERDUE"
    ) {
      overview.tickets.overdue += 1;
    }

    switch (firstResponse.status) {
      case "PENDING":
        overview.firstResponse.pending += 1;
        break;

      case "AT_RISK":
        overview.firstResponse.atRisk += 1;
        break;

      case "OVERDUE":
        overview.firstResponse.overdue += 1;
        break;

      case "MET":
        overview.firstResponse.met += 1;
        break;
    }

    switch (resolution.status) {
      case "PENDING":
        overview.resolution.pending += 1;
        break;

      case "AT_RISK":
        overview.resolution.atRisk += 1;
        break;

      case "PAUSED":
        overview.resolution.paused += 1;
        break;

      case "OVERDUE":
        overview.resolution.overdue += 1;
        break;

      case "MET":
        overview.resolution.met += 1;
        break;

      case "BREACHED":
        overview.resolution.breached += 1;
        break;

      case "CANCELLED":
        overview.resolution.cancelled += 1;
        break;
    }
  }

  return overview;
}