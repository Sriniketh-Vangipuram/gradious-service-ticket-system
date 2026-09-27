import { useQuery } from "@tanstack/react-query";

import { categoryService } from "../api/categoryService";
import { CATEGORY_QUERY_KEYS } from "../api/category.keys";
import type { CategoryFilters } from "../types/category.types";

export const useCategories = (params?: CategoryFilters) => {
  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.list(params),
    queryFn: () => categoryService.getCategories(params),
    placeholderData: (previousData) => previousData,
  });
};