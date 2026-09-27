import { useQuery } from "@tanstack/react-query";

import { softwareService } from "../api/softwareService";
import { SOFTWARE_QUERY_KEYS } from "../api/software.keys";

import type { SoftwareFilters } from "../types/software.types";

export const useSoftware = (
  params?: SoftwareFilters,
) => {
  return useQuery({
    queryKey: SOFTWARE_QUERY_KEYS.list(params),

    queryFn: () =>
      softwareService.getSoftware(params),

    placeholderData: (previousData) =>
      previousData,
  });
};
