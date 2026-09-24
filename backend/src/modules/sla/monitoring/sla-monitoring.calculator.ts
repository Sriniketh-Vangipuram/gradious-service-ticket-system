import {
  SlaCycleOutcome,
} from "../../../generated/prisma/client";

import {
  getBusinessMinutesBetween,
} from "../business-calendar.service";

import type {
  BusinessMinutesCache,
  FirstResponseMonitoring,
  ResolutionMonitoring,
} from "./sla-monitoring.types";

function getAtRiskRemainingMinutes(
  targetMinutes: number,
  thresholdPercent: number,
): number {
  return (
    targetMinutes *
    (1 - thresholdPercent / 100)
  );
}

async function getCachedBusinessMinutes(
  startAt: Date,
  endAt: Date,
  centerId: number,
  cache: BusinessMinutesCache,
): Promise<number> {
  const cacheKey = [
    centerId,
    startAt.getTime(),
    endAt.getTime(),
  ].join(":");

  const cached = cache.get(cacheKey);

  if (cached !== undefined) {
    return cached;
  }

  const minutes =
    await getBusinessMinutesBetween({
      startAt,
      endAt,
      centerId,
    });

  cache.set(cacheKey, minutes);

  return minutes;
}

export async function calculateFirstResponseMonitoring(
  ticket: {
    firstResponseAt: Date | null;
    firstResponseDueAt: Date | null;
    firstResponseTargetMinutes: number | null;
    atRiskThresholdPercent: number;
    centerId: number;
  },
  now: Date,
  businessMinutesCache: BusinessMinutesCache,
): Promise<FirstResponseMonitoring> {
  if (ticket.firstResponseAt !== null) {
    return {
      status: "MET",
      dueAt: ticket.firstResponseDueAt,
      targetMinutes:
        ticket.firstResponseTargetMinutes,
      remainingBusinessMinutes: 0,
    };
  }

  if (
    ticket.firstResponseDueAt === null ||
    ticket.firstResponseTargetMinutes === null
  ) {
    return {
      status: "PENDING",
      dueAt: null,
      targetMinutes: null,
      remainingBusinessMinutes: null,
    };
  }

  if (now >= ticket.firstResponseDueAt) {
    return {
      status: "OVERDUE",
      dueAt: ticket.firstResponseDueAt,
      targetMinutes:
        ticket.firstResponseTargetMinutes,
      remainingBusinessMinutes: 0,
    };
  }

  const remainingBusinessMinutes =
    await getCachedBusinessMinutes(
      now,
      ticket.firstResponseDueAt,
      ticket.centerId,
      businessMinutesCache,
    );

  const atRiskRemainingMinutes =
    getAtRiskRemainingMinutes(
      ticket.firstResponseTargetMinutes,
      ticket.atRiskThresholdPercent,
    );

  if (
    remainingBusinessMinutes <=
    atRiskRemainingMinutes
  ) {
    return {
      status: "AT_RISK",
      dueAt: ticket.firstResponseDueAt,
      targetMinutes:
        ticket.firstResponseTargetMinutes,
      remainingBusinessMinutes,
    };
  }

  return {
    status: "PENDING",
    dueAt: ticket.firstResponseDueAt,
    targetMinutes:
      ticket.firstResponseTargetMinutes,
    remainingBusinessMinutes,
  };
}

export async function calculateResolutionMonitoring(
  ticket: {
    centerId: number;

    slaCycles: Array<{
      id: number;
      cycleNumber: number;
      startedAt: Date;
      dueAt: Date;
      targetMinutes: number;
      resolvedAt: Date | null;
      outcome: SlaCycleOutcome | null;
      pausedAt: Date | null;
      totalPausedMinutes: number;
      atRiskThresholdPercent: number;
    }>;
  },
  now: Date,
  businessMinutesCache: BusinessMinutesCache,
): Promise<ResolutionMonitoring> {
  const latestCycle = ticket.slaCycles[0];

  if (!latestCycle) {
    return {
      status: "PENDING",
      cycleId: null,
      cycleNumber: null,
      startedAt: null,
      dueAt: null,
      targetMinutes: null,
      remainingBusinessMinutes: null,
      pausedAt: null,
      totalPausedMinutes: 0,
    };
  }

  if (
    latestCycle.outcome ===
    SlaCycleOutcome.CANCELLED
  ) {
    return {
      status: "CANCELLED",
      cycleId: latestCycle.id,
      cycleNumber: latestCycle.cycleNumber,
      startedAt: latestCycle.startedAt,
      dueAt: latestCycle.dueAt,
      targetMinutes: latestCycle.targetMinutes,
      remainingBusinessMinutes: 0,
      pausedAt: latestCycle.pausedAt,
      totalPausedMinutes:
        latestCycle.totalPausedMinutes,
    };
  }

  if (latestCycle.resolvedAt !== null) {
    return {
      status:
        latestCycle.outcome ===
        SlaCycleOutcome.BREACHED
          ? "BREACHED"
          : "MET",

      cycleId: latestCycle.id,
      cycleNumber: latestCycle.cycleNumber,
      startedAt: latestCycle.startedAt,
      dueAt: latestCycle.dueAt,
      targetMinutes: latestCycle.targetMinutes,
      remainingBusinessMinutes: 0,
      pausedAt: null,
      totalPausedMinutes:
        latestCycle.totalPausedMinutes,
    };
  }

  if (latestCycle.pausedAt !== null) {
    return {
      status: "PAUSED",
      cycleId: latestCycle.id,
      cycleNumber: latestCycle.cycleNumber,
      startedAt: latestCycle.startedAt,
      dueAt: latestCycle.dueAt,
      targetMinutes: latestCycle.targetMinutes,
      remainingBusinessMinutes: null,
      pausedAt: latestCycle.pausedAt,
      totalPausedMinutes:
        latestCycle.totalPausedMinutes,
    };
  }

  if (now >= latestCycle.dueAt) {
    return {
      status: "OVERDUE",
      cycleId: latestCycle.id,
      cycleNumber: latestCycle.cycleNumber,
      startedAt: latestCycle.startedAt,
      dueAt: latestCycle.dueAt,
      targetMinutes: latestCycle.targetMinutes,
      remainingBusinessMinutes: 0,
      pausedAt: null,
      totalPausedMinutes:
        latestCycle.totalPausedMinutes,
    };
  }

  const remainingBusinessMinutes =
    await getCachedBusinessMinutes(
      now,
      latestCycle.dueAt,
      ticket.centerId,
      businessMinutesCache,
    );

  const atRiskRemainingMinutes =
    getAtRiskRemainingMinutes(
      latestCycle.targetMinutes,
      latestCycle.atRiskThresholdPercent,
    );

  if (
    remainingBusinessMinutes <=
    atRiskRemainingMinutes
  ) {
    return {
      status: "AT_RISK",
      cycleId: latestCycle.id,
      cycleNumber: latestCycle.cycleNumber,
      startedAt: latestCycle.startedAt,
      dueAt: latestCycle.dueAt,
      targetMinutes: latestCycle.targetMinutes,
      remainingBusinessMinutes,
      pausedAt: null,
      totalPausedMinutes:
        latestCycle.totalPausedMinutes,
    };
  }

  return {
    status: "PENDING",
    cycleId: latestCycle.id,
    cycleNumber: latestCycle.cycleNumber,
    startedAt: latestCycle.startedAt,
    dueAt: latestCycle.dueAt,
    targetMinutes: latestCycle.targetMinutes,
    remainingBusinessMinutes,
    pausedAt: null,
    totalPausedMinutes:
      latestCycle.totalPausedMinutes,
  };
}