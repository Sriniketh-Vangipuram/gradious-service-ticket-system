import { httpClient } from "../../../lib/api/http-client";

import type {
  CreateTicketCommentRequest,
  CreateTicketCommentResponse,
  ListTicketCommentsResponse,
} from "../types/comment-api.types";

/* -------------------------------------------------------------------------- */
/* List ticket comments                                                       */
/* -------------------------------------------------------------------------- */

export async function getTicketComments(
  ticketId: number,
): Promise<ListTicketCommentsResponse> {
  const response = await httpClient.get<ListTicketCommentsResponse>(
    `/tickets/${ticketId}/comments`,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Create ticket comment                                                      */
/* -------------------------------------------------------------------------- */

export async function createTicketComment(
  ticketId: number,
  payload: CreateTicketCommentRequest,
): Promise<CreateTicketCommentResponse> {
  const response = await httpClient.post<CreateTicketCommentResponse>(
    `/tickets/${ticketId}/comments`,
    payload,
  );

  return response.data;
}