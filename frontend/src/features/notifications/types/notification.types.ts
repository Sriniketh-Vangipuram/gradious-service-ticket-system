export type NotificationType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_STATUS_CHANGED"
  | "TICKET_REOPENED"
  | "TICKET_RESOLVED"
  | "TICKET_CLOSED"
  | "SLA_AT_RISK"
  | "SLA_BREACHED";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  ticketId: number | null;
  readAt: string | null;
  createdAt: string;
}