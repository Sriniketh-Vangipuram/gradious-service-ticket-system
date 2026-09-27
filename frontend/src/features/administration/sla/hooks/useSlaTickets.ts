import { useQuery } from "@tanstack/react-query";

import { slaService } from "../api/slaService";
import { SLA_QUERY_KEYS } from "../api/sla.keys";

import type {
  SlaTicketFilters,
} from "../types/sla.types";

export function useSlaTickets(
  params?: SlaTicketFilters,
) {
  return useQuery({
    queryKey:
      SLA_QUERY_KEYS.ticketList(params),

    queryFn: () =>
      slaService.getTickets(params),

    placeholderData: (
      previousData,
    ) => previousData,

    staleTime: 15 * 1000,
  });
}