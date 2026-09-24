export type TicketStatus =
  | "OPEN"
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED";

export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SoftwareRequestType =
  | "INSTALLATION"
  | "UPDATE"
  | "UNINSTALLATION"
  | "LICENSE";

export interface TicketRequester {
  id: number;
  fullName: string;
  email: string;
}

export interface TicketAssignee {
  id: number;
  fullName: string;
  email: string;
}

export interface TicketCenter {
  id: number;
  name: string;
  code: string;
}

export interface TicketLab {
  id: number;
  name: string;
  code: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;

  title: string;
  description: string;

  status: TicketStatus;
  priority: TicketPriority;
  requestType: SoftwareRequestType | null;

  requesterId: number;
  assigneeId: number | null;

  centerId: number;
  labId: number;
  categoryId: number;
  softwareId: number | null;

  createdAt: string;
  updatedAt: string;

  resolvedAt: string | null;
  closedAt: string | null;

  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;

  firstResponseTargetMinutes: number | null;
  resolutionTargetMinutes: number | null;

  requester: TicketRequester;
  assignee: TicketAssignee | null;

  center: TicketCenter;
  lab: TicketLab;

  /**
   * Category and software response shapes are not part
   * of the frontend contract yet.
   *
   * Keep them opaque until their backend contracts
   * are explicitly established.
   */
  category: unknown;
  software: unknown | null;
}


export type TechnicianSpecialization =
  | "SOFTWARE"
  | "HARDWARE"
  | "NETWORK";

export interface EligibleTechnician {
  id: number;
  fullName: string;
  email: string;
  specializations: TechnicianSpecialization[];
}