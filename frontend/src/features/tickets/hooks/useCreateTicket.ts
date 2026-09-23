import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createTicket } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type { CreateTicketRequest } from "../types/ticket-api.types";

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketRequest) =>
      createTicket(payload),

    onSuccess: async (response) => {
      const createdTicket = response.data.ticket;

      queryClient.setQueryData(
        TICKET_QUERY_KEYS.detail(createdTicket.id),
        response,
      );

      await queryClient.invalidateQueries({
        queryKey: TICKET_QUERY_KEYS.lists(),
      });
    },
  });
}