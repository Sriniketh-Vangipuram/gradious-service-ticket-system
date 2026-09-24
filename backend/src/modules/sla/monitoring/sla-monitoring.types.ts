import {
  SlaCycleOutcome,
  TicketPriority,
  TicketStatus,
} from "../../../generated/prisma/client";

import type { SlaMonitoringStatus } from "../sla.schemas";

export type SlaMonitoringActor = {
  userId: number;
  role:
    | "EMPLOYEE"
    | "TECHNICIAN"
    | "CENTER_MANAGER"
    | "ADMIN";
};

export type FirstResponseMonitoring = {
  status: Extract<
    SlaMonitoringStatus,
    "PENDING" | "AT_RISK" | "OVERDUE" | "MET"
  >;

  dueAt: Date | null;

  targetMinutes: number | null;

  remainingBusinessMinutes: number | null;
};

export type ResolutionMonitoring = {
  status: SlaMonitoringStatus;

  cycleId: number | null;

  cycleNumber: number | null;

  startedAt: Date | null;

  dueAt: Date | null;

  targetMinutes: number | null;

  remainingBusinessMinutes: number | null;

  pausedAt: Date | null;

  totalPausedMinutes: number;
};

export type SlaTicketMonitoringItem = {
  id: number;

  ticketNumber: string;

  title: string;

  status: TicketStatus;

  priority: TicketPriority;

  center: {
    id: number;
    name: string;
    code: string;
  };

  category: {
    id: number;
    name: string;
    code: string;
  };

  requester: {
    id: number;
    fullName: string;
  };

  assignee: {
    id: number;
    fullName: string;
  } | null;

  firstResponse: FirstResponseMonitoring;

  resolution: ResolutionMonitoring;
};

export type SlaMonitoringTicketRecord = {
  id: number;

  ticketNumber: string;

  title: string;

  status: TicketStatus;

  priority: TicketPriority;

  centerId: number;

  firstResponseAt: Date | null;

  firstResponseDueAt: Date | null;

  firstResponseTargetMinutes: number | null;

  atRiskThresholdPercent: number;

  center: {
    id: number;
    name: string;
    code: string;
  };

  category: {
    id: number;
    name: string;
    code: string;
  };

  requester: {
    id: number;
    fullName: string;
  };

  assignee: {
    id: number;
    fullName: string;
  } | null;

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
};

export type BusinessMinutesCache = Map<string, number>;

export type SlaOverview = {
  tickets: {
    active: number;
    paused: number;
    dueSoon: number;
    overdue: number;
  };

  firstResponse: {
    pending: number;
    atRisk: number;
    overdue: number;
    met: number;
  };

  resolution: {
    pending: number;
    atRisk: number;
    paused: number;
    overdue: number;
    met: number;
    breached: number;
    cancelled: number;
  };
};