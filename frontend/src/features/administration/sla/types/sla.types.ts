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

export type SlaMonitoringStatus =
  | "PENDING"
  | "AT_RISK"
  | "OVERDUE"
  | "PAUSED"
  | "MET"
  | "BREACHED"
  | "CANCELLED";

/* -------------------------------------------------------------------------- */
/* SLA Overview                                                               */
/* -------------------------------------------------------------------------- */

export interface SlaOverview {
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
}

export interface SlaOverviewResponse {
  success: true;
  data: SlaOverview;
}

/* -------------------------------------------------------------------------- */
/* SLA Ticket Monitoring                                                      */
/* -------------------------------------------------------------------------- */

export interface FirstResponseMonitoring {
  status:
    | "PENDING"
    | "AT_RISK"
    | "OVERDUE"
    | "MET";

  dueAt: string | null;

  targetMinutes: number | null;

  remainingBusinessMinutes: number | null;
}

export interface ResolutionMonitoring {
  status: SlaMonitoringStatus;

  cycleId: number | null;

  cycleNumber: number | null;

  startedAt: string | null;

  dueAt: string | null;

  targetMinutes: number | null;

  remainingBusinessMinutes: number | null;

  pausedAt: string | null;

  totalPausedMinutes: number;
}

export interface SlaCenterSummary {
  id: number;
  name: string;
  code: string;
}

export interface SlaCategorySummary {
  id: number;
  name: string;
  code: string;
}

export interface SlaRequesterSummary {
  id: number;
  fullName: string;
}

export interface SlaAssigneeSummary {
  id: number;
  fullName: string;
}

export interface SlaTicketMonitoringItem {
  id: number;

  ticketNumber: string;

  title: string;

  status: TicketStatus;

  priority: TicketPriority;

  center: SlaCenterSummary;

  category: SlaCategorySummary;

  requester: SlaRequesterSummary;

  assignee: SlaAssigneeSummary | null;

  firstResponse: FirstResponseMonitoring;

  resolution: ResolutionMonitoring;
}

export interface SlaTicketsPagination {
  hasNextPage: boolean;

  nextCursor: number | null;
}

export interface SlaTicketsData {
  items: SlaTicketMonitoringItem[];

  pagination: SlaTicketsPagination;
}

export interface SlaTicketsResponse {
  success: true;
  data: SlaTicketsData;
}

/* -------------------------------------------------------------------------- */
/* SLA Ticket Filters                                                         */
/* -------------------------------------------------------------------------- */

export interface SlaTicketFilters {
  priority?: TicketPriority;

  ticketStatus?: TicketStatus;

  centerId?: number;

  categoryId?: number;

  assigneeId?: number;

  firstResponseStatus?: SlaMonitoringStatus;

  resolutionStatus?: SlaMonitoringStatus;

  paused?: boolean;

  limit?: number;

  cursor?: number;
}

/* -------------------------------------------------------------------------- */
/* SLA Policies                                                               */
/* -------------------------------------------------------------------------- */

export interface SlaPolicy {
  id: number;

  priority: TicketPriority;

  firstResponseMinutes: number;

  resolutionMinutes: number;

  isActive: boolean;

  atRiskThresholdPercent: number;

  createdAt: string;

  updatedAt: string;
}

export interface SlaPoliciesResponse {
  success: true;

  data: SlaPolicy[];
}

export interface SlaPolicyResponse {
  success: true;

  data: SlaPolicy;
}

export interface UpsertSlaPolicyInput {
  firstResponseMinutes: number;

  resolutionMinutes: number;

  atRiskThresholdPercent: number;
}

export interface UpdateSlaPolicyStatusInput {
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/* SLA Policy Priority                                                        */
/* -------------------------------------------------------------------------- */

export type SlaPolicyPriority = TicketPriority;

/* -------------------------------------------------------------------------- */
/* SLA Overview Filters                                                       */
/* -------------------------------------------------------------------------- */

export interface SlaOverviewFilters {
  centerId?: number;
}