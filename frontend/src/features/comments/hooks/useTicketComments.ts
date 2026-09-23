import { useQuery } from "@tanstack/react-query";

import { getTicketComments } from "../api/comment.api";
import { COMMENT_QUERY_KEYS } from "../api/comment.keys";

export function useTicketComments(ticketId: number | null) {
  return useQuery({
    queryKey:
      ticketId === null
        ? COMMENT_QUERY_KEYS.list(0)
        : COMMENT_QUERY_KEYS.list(ticketId),

    queryFn: () => {
      if (ticketId === null) {
        throw new Error("Ticket ID is required.");
      }

      return getTicketComments(ticketId);
    },

    enabled: ticketId !== null,

    staleTime: 15_000,
  });
}