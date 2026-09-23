import { useQuery } from "@tanstack/react-query";
import {
  getTicketCategories,
  getTicketSoftware,
} from "../api/catalog.api";
import { CATALOG_QUERY_KEYS } from "../api/catalog.keys";

export function useTicketCategories() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.categories(),
    queryFn: getTicketCategories,
  });
}

export function useTicketSoftware() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEYS.software(),
    queryFn: getTicketSoftware,
  });
}