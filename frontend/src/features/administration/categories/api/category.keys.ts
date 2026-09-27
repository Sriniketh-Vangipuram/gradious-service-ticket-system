export const CATEGORY_QUERY_KEYS = {
  all: ["categories"] as const,

  lists: () => [...CATEGORY_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...CATEGORY_QUERY_KEYS.lists(), params] as const,

  details: () => [...CATEGORY_QUERY_KEYS.all, "detail"] as const,

  detail: (categoryId: number) =>
    [...CATEGORY_QUERY_KEYS.details(), categoryId] as const,
};