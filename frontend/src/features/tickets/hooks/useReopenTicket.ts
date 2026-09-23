import { useMutation, useQueryClient } from "@tanstack/react-query";

import { reopenTicket } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type { ReopenTicketRequest } from "../types/ticket-api.types";

interface ReopenTicketVariables {
  ticketId: number;
  payload: ReopenTicketRequest;
}

export function useReopenTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: ReopenTicketVariables) =>
      reopenTicket(ticketId, payload),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(variables.ticketId),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.lists(),
        }),
      ]);
    },
  });
}