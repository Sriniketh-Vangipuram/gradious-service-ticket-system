import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import { getLabs } from "../api/labService";
import { LAB_QUERY_KEYS } from "../api/lab.keys";

import type { LabFilters } from "../types/lab.types";

export function useLabs(
  params?: LabFilters,
) {
  return useQuery({
    queryKey: LAB_QUERY_KEYS.list(params),

    queryFn: () => getLabs(params),

    placeholderData: keepPreviousData,
  });
}