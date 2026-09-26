import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import { getCenters } from "../api/centerService";

import { CENTER_QUERY_KEYS } from "../api/center.keys";

import type { CenterFilters } from "../types/center.types";

export function useCenters(
  params?: CenterFilters,
) {
  return useQuery({
    queryKey: CENTER_QUERY_KEYS.list(params),

    queryFn: () => getCenters(params),

    placeholderData: keepPreviousData,
  });
}