export const CATALOG_QUERY_KEYS = {
  all: ["ticket-catalog"] as const,

  categories: () => [...CATALOG_QUERY_KEYS.all, "categories"] as const,

  software: () => [...CATALOG_QUERY_KEYS.all, "software"] as const,
};