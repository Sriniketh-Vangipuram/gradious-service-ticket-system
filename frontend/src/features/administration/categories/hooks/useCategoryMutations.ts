import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoryService } from "../api/categoryService";
import { CATEGORY_QUERY_KEYS } from "../api/category.keys";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from "../types/category.types";

export const useCategoryMutations = () => {
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CreateCategoryInput) =>
      categoryService.createCategory(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: UpdateCategoryInput;
    }) => categoryService.updateCategory(categoryId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.detail(
          variables.categoryId,
        ),
      });
    },
  });

  const updateCategoryStatusMutation = useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: UpdateCategoryStatusInput;
    }) => categoryService.updateCategoryStatus(categoryId, payload),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.detail(
          variables.categoryId,
        ),
      });
    },
  });

  return {
    createCategoryMutation,
    updateCategoryMutation,
    updateCategoryStatusMutation,
  };
};