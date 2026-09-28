import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cancelTicket } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type { CancelTicketRequest } from "../types/ticket-api.types";

interface CancelTicketVariables {
  ticketId: number;
  payload: CancelTicketRequest;
}

export function useCancelTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: CancelTicketVariables) =>
      cancelTicket(ticketId, payload),

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