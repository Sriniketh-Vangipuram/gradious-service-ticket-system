import { useQuery } from "@tanstack/react-query";

import { getTicketComments } from "../api/comment.api";
import { COMMENT_QUERY_KEYS } from "../api/comment.keys";

import type { UserRole } from "../../auth/types/auth.types";

export function useTicketComments(
  ticketId: number | null,
  userId: number | null,
  role: UserRole | null,
) {
  return useQuery({
    queryKey:
      ticketId === null || userId === null || role === null
        ? COMMENT_QUERY_KEYS.list(0, 0, "EMPLOYEE")
        : COMMENT_QUERY_KEYS.list(
            ticketId,
            userId,
            role,
          ),

    queryFn: () => {
      if (ticketId === null) {
        throw new Error("Ticket ID is required.");
      }

      return getTicketComments(ticketId);
    },

    enabled:
      ticketId !== null &&
      userId !== null &&
      role !== null,

    staleTime: 15_000,
  });
}