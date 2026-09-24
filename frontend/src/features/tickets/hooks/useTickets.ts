import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

import { getTickets,getTicket } from "../api/ticket.api";
import { TICKET_QUERY_KEYS } from "../api/ticket.keys";
import type {
  ListTicketsParams,
} from "../types/ticket-api.types";

import { getEligibleTechnicians } from "../api/ticket.api";



export function useTickets(
  params?: Omit<ListTicketsParams, "cursor">,
) {
  return useInfiniteQuery({
    queryKey: TICKET_QUERY_KEYS.list(params),

    queryFn: ({ pageParam }) =>
      getTickets({
        ...params,
        cursor: pageParam,
      }),

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      if (!lastPage.data.pagination.hasNextPage) {
        return undefined;
      }

      return lastPage.data.pagination.nextCursor ?? undefined;
    },

    placeholderData: keepPreviousData,
  });
}


export function useTicket(ticketId: number | null) {
  return useQuery({
    queryKey:
      ticketId === null
        ? TICKET_QUERY_KEYS.detail(0)
        : TICKET_QUERY_KEYS.detail(ticketId),

    queryFn: () => {
      if (ticketId === null) {
        throw new Error("Ticket ID is required.");
      }

      return getTicket(ticketId);
    },

    enabled: ticketId !== null,

    staleTime: 30_000,
  });
}


export function useEligibleTechnicians(
  ticketId: number | null,
) {
  return useQuery({
    queryKey:
      ticketId === null
        ? TICKET_QUERY_KEYS.eligibleTechnicians(0)
        : TICKET_QUERY_KEYS.eligibleTechnicians(ticketId),

    queryFn: () => {
      if (ticketId === null) {
        throw new Error("Ticket ID is required.");
      }

      return getEligibleTechnicians(ticketId);
    },

    enabled: ticketId !== null,

    staleTime: 30_000,
  });
}