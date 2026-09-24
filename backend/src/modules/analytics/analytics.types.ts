import type {
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/client";

export type AnalyticsGranularity = "day" | "week" | "month";

export type AnalyticsFilters = {
  from: Date;
  to: Date;
  centerId?: number;
  categoryId?: number;
  priority?: TicketPriority;
};

export type AnalyticsScope = {
  userId: number;
  role: "ADMIN" | "CENTER_MANAGER";
  centerIds?: number[];
};

export type AnalyticsQuery = AnalyticsFilters & {
  scope: AnalyticsScope;
  granularity?: AnalyticsGranularity;
};


export type TicketVolumeResult = {
  total: number;
  byStatus: Array<{
    status: TicketStatus;
    count: number;
  }>;
};

export type TicketTrendPoint = {
  period: string;
  count: number;
};

export type BreakdownResult = {
  id: number;
  name: string;
  count: number;
};

export type PriorityBreakdownResult = {
  priority: TicketPriority;
  count: number;
};

export type SlaComplianceResult = {
  totalCompleted: number;
  met: number;
  breached: number;
  complianceRate: number;
};

export type TimeMetricResult = {
  averageMinutes: number | null;
  sampleSize: number;
};

export type TechnicianWorkloadResult = {
  technicianId: number;
  technicianName: string;
  assignedTickets: number;
  activeTickets: number;
  resolvedTickets: number;
};

export type ResolutionRateResult = {
  totalTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
};