import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTicketComment } from "../api/comment.api";
import { COMMENT_QUERY_KEYS } from "../api/comment.keys";
import type { CreateTicketCommentRequest } from "../types/comment-api.types";
import { TICKET_QUERY_KEYS } from "../../tickets/api/ticket.keys";

interface CreateTicketCommentVariables {
  ticketId: number;
  payload: CreateTicketCommentRequest;
}

export function useCreateTicketComment() {
  const queryClient = useQueryClient();

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
          queryKey: COMMENT_QUERY_KEYS.list(variables.ticketId),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(variables.ticketId),
        }),
      ]);
    },
  });
}