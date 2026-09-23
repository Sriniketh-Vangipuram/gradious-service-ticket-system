import { useMutation, useQueryClient } from "@tanstack/react-query";

import { changeTicketStatus } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type { ChangeTicketStatusRequest } from "../types/ticket-api.types";

interface ChangeTicketStatusVariables {
  ticketId: number;
  payload: ChangeTicketStatusRequest;
}

export function useChangeTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: ChangeTicketStatusVariables) =>
      changeTicketStatus(ticketId, payload),

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