import { useQuery } from "@tanstack/react-query";

import { slaService } from "../api/slaService";
import { SLA_QUERY_KEYS } from "../api/sla.keys";

import type {
  SlaOverviewFilters,
} from "../types/sla.types";

export function useSlaOverview(
  params?: SlaOverviewFilters,
) {
  return useQuery({
    queryKey:
      SLA_QUERY_KEYS.overviewWithFilters(params),

    queryFn: () =>
      slaService.getOverview(params),

    staleTime: 30 * 1000,
  });
}