import { httpClient } from "../../../lib/api/http-client";
import type {
  CategoriesResponse,
  SoftwareResponse,
} from "../types/catalog.types";

export async function getTicketCategories() {
  const response =
    await httpClient.get<CategoriesResponse>("/catalog/categories");

  return response.data.data.categories;
}

export async function getTicketSoftware() {
  const response =
    await httpClient.get<SoftwareResponse>("/catalog/software");

  return response.data.data.software;
}