export const CENTER_QUERY_KEYS = {
  all: ["centers"] as const,

  lists: () =>
    [...CENTER_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...CENTER_QUERY_KEYS.lists(), params] as const,

  details: () =>
    [...CENTER_QUERY_KEYS.all, "detail"] as const,

  detail: (centerId: number) =>
    [...CENTER_QUERY_KEYS.details(), centerId] as const,
};