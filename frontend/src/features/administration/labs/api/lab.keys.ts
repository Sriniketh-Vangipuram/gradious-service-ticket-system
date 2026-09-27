export const LAB_QUERY_KEYS = {
  all: ["labs"] as const,

  lists: () =>
    [...LAB_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...LAB_QUERY_KEYS.lists(), params] as const,

  details: () =>
    [...LAB_QUERY_KEYS.all, "detail"] as const,

  detail: (labId: number) =>
    [...LAB_QUERY_KEYS.details(), labId] as const,
};