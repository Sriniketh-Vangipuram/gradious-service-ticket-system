import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  SoftwareRequestType,
} from "./ticket.types";

/* -------------------------------------------------------------------------- */
/* Shared API response                                                        */
/* -------------------------------------------------------------------------- */

export interface TicketSuccessResponse<T> {
  success: true;
  data: T;
}

/* -------------------------------------------------------------------------- */
/* Create ticket                                                              */
/* -------------------------------------------------------------------------- */

export interface CreateTicketRequest {
  title: string;
  description: string;
  categoryId: number;
  softwareId?: number;
  priority: TicketPriority;
  requestType?: SoftwareRequestType;
}

export type CreateTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* List tickets                                                               */
/* -------------------------------------------------------------------------- */

export type TicketSort = "newest" | "oldest";

export interface ListTicketsParams {
  cursor?: string;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: number;
  centerId?: number;
  labId?: number;
  search?: string;
  sort?: TicketSort;
}

export interface TicketPagination {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ListTicketsData {
  items: Ticket[];
  pagination: TicketPagination;
}

export type ListTicketsResponse =
  TicketSuccessResponse<ListTicketsData>;

/* -------------------------------------------------------------------------- */
/* Get ticket                                                                 */
/* -------------------------------------------------------------------------- */

export type GetTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Update ticket                                                              */
/* -------------------------------------------------------------------------- */

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  categoryId?: number;
  softwareId?: number | null;
  requestType?: SoftwareRequestType | null;
  centerId?: number;
  labId?: number;
  priority?: TicketPriority;
}

export type UpdateTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Assignment                                                                 */
/* -------------------------------------------------------------------------- */

export interface AssignTicketRequest {
  assigneeId: number | null;
}

export type AssignTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Ordinary status change                                                     */
/* -------------------------------------------------------------------------- */

export type OrdinaryTicketStatus =
  | "TRIAGED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_USER";

export interface ChangeTicketStatusRequest {
  status: OrdinaryTicketStatus;
}

export type ChangeTicketStatusResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Resolve                                                                    */
/* -------------------------------------------------------------------------- */

export interface ResolveTicketRequest {
  resolution: string;
  reason?: string;
}

export type ResolveTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Reopen                                                                     */
/* -------------------------------------------------------------------------- */

export interface ReopenTicketRequest {
  reason: string;
}

export type ReopenTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Confirm closure                                                            */
/* -------------------------------------------------------------------------- */

export type ConfirmClosureResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;

/* -------------------------------------------------------------------------- */
/* Cancel                                                                     */
/* -------------------------------------------------------------------------- */

export interface CancelTicketRequest {
  reason: string;
}

export type CancelTicketResponse =
  TicketSuccessResponse<{
    ticket: Ticket;
  }>;
