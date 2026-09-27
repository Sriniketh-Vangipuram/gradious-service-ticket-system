/* -------------------------------------------------------------------------- */
/* Analytics Enums                                                            */
/* -------------------------------------------------------------------------- */

export type AnalyticsGranularity =
  | "day"
  | "week"
  | "month";

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type TicketStatus =
  | "OPEN"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

/* -------------------------------------------------------------------------- */
/* Analytics Filters                                                          */
/* -------------------------------------------------------------------------- */

export interface AnalyticsFilters {
  from: string;

  to: string;

  centerId?: number;

  categoryId?: number;

  priority?: TicketPriority;
}

export interface AnalyticsTrendFilters
  extends AnalyticsFilters {
  granularity?: AnalyticsGranularity;
}

/* -------------------------------------------------------------------------- */
/* Ticket Volume                                                              */
/* -------------------------------------------------------------------------- */

export interface TicketVolumeResult {
  total: number;

  byStatus: Array<{
    status: TicketStatus;

    count: number;
  }>;
}

export interface TicketVolumeResponse {
  success: true;

  data: TicketVolumeResult;
}

/* -------------------------------------------------------------------------- */
/* Ticket Trends                                                              */
/* -------------------------------------------------------------------------- */

export interface TicketTrendPoint {
  period: string;

  count: number;
}

export interface TicketTrendsResponse {
  success: true;

  data: TicketTrendPoint[];
}

/* -------------------------------------------------------------------------- */
/* Center / Category Breakdown                                                */
/* -------------------------------------------------------------------------- */

export interface BreakdownResult {
  id: number;

  name: string;

  count: number;
}

export interface BreakdownResponse {
  success: true;

  data: BreakdownResult[];
}

/* -------------------------------------------------------------------------- */
/* Priority Breakdown                                                         */
/* -------------------------------------------------------------------------- */

export interface PriorityBreakdownResult {
  priority: TicketPriority;

  count: number;
}

export interface PriorityBreakdownResponse {
  success: true;

  data: PriorityBreakdownResult[];
}

/* -------------------------------------------------------------------------- */
/* SLA Compliance                                                             */
/* -------------------------------------------------------------------------- */

export interface SlaComplianceResult {
  totalCompleted: number;

  met: number;

  breached: number;

  complianceRate: number;
}

export interface SlaComplianceResponse {
  success: true;

  data: SlaComplianceResult;
}

/* -------------------------------------------------------------------------- */
/* Time Metrics                                                               */
/* -------------------------------------------------------------------------- */

export interface TimeMetricResult {
  averageMinutes: number | null;

  sampleSize: number;
}

export interface TimeMetricResponse {
  success: true;

  data: TimeMetricResult;
}

/* -------------------------------------------------------------------------- */
/* Technician Workload                                                       */
/* -------------------------------------------------------------------------- */

export interface TechnicianWorkloadResult {
  technicianId: number;

  technicianName: string;

  assignedTickets: number;

  activeTickets: number;

  resolvedTickets: number;
}

export interface TechnicianWorkloadResponse {
  success: true;

  data: TechnicianWorkloadResult[];
}

/* -------------------------------------------------------------------------- */
/* Resolution Rate                                                            */
/* -------------------------------------------------------------------------- */

export interface ResolutionRateResult {
  totalTickets: number;

  resolvedTickets: number;

  resolutionRate: number;
}

export interface ResolutionRateResponse {
  success: true;

  data: ResolutionRateResult;
}

/* -------------------------------------------------------------------------- */
/* Analytics Overview                                                         */
/* -------------------------------------------------------------------------- */

export interface AnalyticsOverview {
  ticketVolume: TicketVolumeResult;

  slaCompliance: SlaComplianceResult;

  responseTime: TimeMetricResult;

  resolutionTime: TimeMetricResult;

  resolutionRate: ResolutionRateResult;
}

export interface AnalyticsOverviewResponse {
  success: true;

  data: AnalyticsOverview;
}