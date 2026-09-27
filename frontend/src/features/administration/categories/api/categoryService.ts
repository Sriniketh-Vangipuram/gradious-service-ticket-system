import {httpClient} from "../../../../lib/api/http-client";

import type {
  CategoryFilters,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from "../types/category.types";

export const categoryService = {
  async getCategories(
    params?: CategoryFilters,
  ): Promise<CategoryListResponse> {
    const response = await httpClient.get<CategoryListResponse>(
      "/categories",
      {
        params,
      },
    );

    return response.data;
  },

  async getCategoryById(
    categoryId: number,
  ): Promise<CategoryResponse> {
    const response = await httpClient.get<CategoryResponse>(
      `/categories/${categoryId}`,
    );

    return response.data;
  },

  async createCategory(
    payload: CreateCategoryInput,
  ): Promise<CategoryResponse> {
    const response = await httpClient.post<CategoryResponse>(
      "/categories",
      payload,
    );

    return response.data;
  },

  async updateCategory(
    categoryId: number,
    payload: UpdateCategoryInput,
  ): Promise<CategoryResponse> {
    const response = await httpClient.patch<CategoryResponse>(
      `/categories/${categoryId}`,
      payload,
    );

    return response.data;
  },

  async updateCategoryStatus(
    categoryId: number,
    payload: UpdateCategoryStatusInput,
  ): Promise<CategoryResponse> {
    const response = await httpClient.patch<CategoryResponse>(
      `/categories/${categoryId}/status`,
      payload,
    );

    return response.data;
  },
};