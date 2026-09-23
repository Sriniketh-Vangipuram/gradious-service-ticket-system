import { useMutation, useQueryClient } from "@tanstack/react-query";

import { resolveTicket } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type { ResolveTicketRequest } from "../types/ticket-api.types";

interface ResolveTicketVariables {
  ticketId: number;
  payload: ResolveTicketRequest;
}

export function useResolveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: ResolveTicketVariables) =>
      resolveTicket(ticketId, payload),

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