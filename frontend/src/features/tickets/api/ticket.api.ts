import { httpClient } from "../../../lib/api/http-client";

import type {
  AssignTicketRequest,
  AssignTicketResponse,
  CancelTicketRequest,
  CancelTicketResponse,
  ChangeTicketStatusRequest,
  ChangeTicketStatusResponse,
  ConfirmClosureResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  GetTicketResponse,
  ListTicketsParams,
  ListTicketsResponse,
  ReopenTicketRequest,
  ReopenTicketResponse,
  ResolveTicketRequest,
  ResolveTicketResponse,
  UpdateTicketRequest,
  UpdateTicketResponse,
  TicketSuccessResponse,
} from "../types/ticket-api.types";
import type { EligibleTechnician } from "../types/ticket.types";



/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function createIdempotencyKey(): string {
  return `ticket-create-${crypto.randomUUID()}`;
}

/* -------------------------------------------------------------------------- */
/* Create ticket                                                              */
/* -------------------------------------------------------------------------- */

export async function createTicket(
  payload: CreateTicketRequest,
): Promise<CreateTicketResponse> {
  const response = await httpClient.post<CreateTicketResponse>(
    "/tickets",
    payload,
    {
      headers: {
        "Idempotency-Key": createIdempotencyKey(),
      },
    },
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* List tickets                                                               */
/* -------------------------------------------------------------------------- */

export async function getTickets(
  params?: ListTicketsParams,
): Promise<ListTicketsResponse> {
  const response = await httpClient.get<ListTicketsResponse>(
    "/tickets",
    {
      params,
    },
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Get ticket                                                                 */
/* -------------------------------------------------------------------------- */

export async function getTicket(
  ticketId: number,
): Promise<GetTicketResponse> {
  const response = await httpClient.get<GetTicketResponse>(
    `/tickets/${ticketId}`,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update ticket                                                              */
/* -------------------------------------------------------------------------- */

export async function updateTicket(
  ticketId: number,
  payload: UpdateTicketRequest,
): Promise<UpdateTicketResponse> {
  const response = await httpClient.patch<UpdateTicketResponse>(
    `/tickets/${ticketId}`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Assignment                                                                 */
/* -------------------------------------------------------------------------- */

export async function assignTicket(
  ticketId: number,
  payload: AssignTicketRequest,
): Promise<AssignTicketResponse> {
  const response = await httpClient.patch<AssignTicketResponse>(
    `/tickets/${ticketId}/assignment`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Ordinary status change                                                     */
/* -------------------------------------------------------------------------- */

export async function changeTicketStatus(
  ticketId: number,
  payload: ChangeTicketStatusRequest,
): Promise<ChangeTicketStatusResponse> {
  const response = await httpClient.patch<ChangeTicketStatusResponse>(
    `/tickets/${ticketId}/status`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Resolve                                                                    */
/* -------------------------------------------------------------------------- */

export async function resolveTicket(
  ticketId: number,
  payload: ResolveTicketRequest,
): Promise<ResolveTicketResponse> {
  const response = await httpClient.post<ResolveTicketResponse>(
    `/tickets/${ticketId}/resolve`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Confirm closure                                                            */
/* -------------------------------------------------------------------------- */

export async function confirmTicketClosure(
  ticketId: number,
): Promise<ConfirmClosureResponse> {
  const response = await httpClient.post<ConfirmClosureResponse>(
    `/tickets/${ticketId}/confirm-closure`,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Reopen                                                                     */
/* -------------------------------------------------------------------------- */

export async function reopenTicket(
  ticketId: number,
  payload: ReopenTicketRequest,
): Promise<ReopenTicketResponse> {
  const response = await httpClient.post<ReopenTicketResponse>(
    `/tickets/${ticketId}/reopen`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Cancel                                                                     */
/* -------------------------------------------------------------------------- */

export async function cancelTicket(
  ticketId: number,
  payload: CancelTicketRequest,
): Promise<CancelTicketResponse> {
  const response = await httpClient.post<CancelTicketResponse>(
    `/tickets/${ticketId}/cancel`,
    payload,
  );

  return response.data;
}

export type GetEligibleTechniciansResponse =
  TicketSuccessResponse<{
    technicians: EligibleTechnician[];
  }>;

export async function getEligibleTechnicians(
  ticketId: number,
): Promise<GetEligibleTechniciansResponse> {
  const response =
    await httpClient.get<GetEligibleTechniciansResponse>(
      `/tickets/${ticketId}/eligible-technicians`,
    );

  return response.data;
}