import { useMutation, useQueryClient } from "@tanstack/react-query";

import { confirmTicketClosure } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";

export function useConfirmTicketClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) =>
      confirmTicketClosure(ticketId),

    retry: false,

    onSuccess: async (_response, ticketId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(ticketId),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.lists(),
        }),
      ]);
    },
  });
}