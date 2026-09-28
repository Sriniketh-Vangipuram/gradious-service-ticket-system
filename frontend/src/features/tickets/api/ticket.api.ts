import { httpClient } from "../../../lib/api/http-client";

import type {
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
  AssignCenterManagerRequest,
  AssignCenterManagerResponse,
  AssignTechnicianRequest,
  AssignTechnicianResponse,
  GetEligibleManagersResponse,
  RequestCancellationRequest,
  RequestCancellationResponse,
  ReviewCancellationRequest,
  ApproveCancellationRequestResponse,
  RejectCancellationRequestResponse,
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

export async function requestTicketCancellation(
  ticketId: number,
  payload: RequestCancellationRequest,
): Promise<RequestCancellationResponse> {
  const response =
    await httpClient.post<RequestCancellationResponse>(
      `/tickets/${ticketId}/cancellation-request`,
      payload,
    );

  return response.data;
}

export async function approveTicketCancellationRequest(
  ticketId: number,
  historyId: number,
): Promise<ApproveCancellationRequestResponse> {
  const response =
    await httpClient.post<ApproveCancellationRequestResponse>(
      `/tickets/${ticketId}/cancellation-request/${historyId}/approve`,
    );

  return response.data;
}


export async function rejectTicketCancellationRequest(
  ticketId: number,
  historyId: number,
  payload: ReviewCancellationRequest,
): Promise<RejectCancellationRequestResponse> {
  const response =
    await httpClient.post<RejectCancellationRequestResponse>(
      `/tickets/${ticketId}/cancellation-request/${historyId}/reject`,
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



export async function getEligibleManagers(
  ticketId: number,
): Promise<GetEligibleManagersResponse> {
  const response = await httpClient.get<
    GetEligibleManagersResponse
  >(
    `/tickets/${ticketId}/eligible-managers`,
  );

  return response.data;
}

export async function assignCenterManager(
  ticketId: number,
  payload: AssignCenterManagerRequest,
): Promise<AssignCenterManagerResponse> {
  const response = await httpClient.patch<
    AssignCenterManagerResponse
  >(
    `/tickets/${ticketId}/manager`,
    payload,
  );

  return response.data;
}

export async function assignTechnician(
  ticketId: number,
  payload: AssignTechnicianRequest,
): Promise<AssignTechnicianResponse> {
  const response = await httpClient.patch<
    AssignTechnicianResponse
  >(
    `/tickets/${ticketId}/technician`,
    payload,
  );

  return response.data;
}