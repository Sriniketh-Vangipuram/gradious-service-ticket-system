import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTicketComment,requestTicketInformation } from "../api/comment.api";
import { COMMENT_QUERY_KEYS } from "../api/comment.keys";
import type { CreateTicketCommentRequest,RequestInformationRequest } from "../types/comment-api.types";
import { TICKET_QUERY_KEYS } from "../../tickets/api/ticket.keys";
import { useAuth } from "../../auth/hooks/useAuth";

interface CreateTicketCommentVariables {
  ticketId: number;
  payload: CreateTicketCommentRequest;
}

export function useCreateTicketComment() {
  const queryClient = useQueryClient();

  const {user: currentUser} = useAuth();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: CreateTicketCommentVariables) =>
      createTicketComment(ticketId, payload),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.list(
            variables.ticketId,
            currentUser?.id ?? 0,
            currentUser?.role ?? "EMPLOYEE",
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(variables.ticketId),
        }),
      ]);
    },
  });
}

interface RequestTicketInformationVariables {
  ticketId: number;
  payload: RequestInformationRequest;
}

export function useRequestTicketInformation() {
  const queryClient = useQueryClient();
  const {user: currentUser} = useAuth();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: RequestTicketInformationVariables) =>
      requestTicketInformation(ticketId, payload),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: COMMENT_QUERY_KEYS.list(
            variables.ticketId,
            currentUser?.id ?? 0,
            currentUser?.role ?? "EMPLOYEE",
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(variables.ticketId),
        }),
      ]);
    },
  });
}