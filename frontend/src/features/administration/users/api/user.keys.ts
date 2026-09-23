export const USER_QUERY_KEYS = {
  all: ["users"] as const,

  lists: () => [...USER_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...USER_QUERY_KEYS.lists(), params] as const,

  details: () => [...USER_QUERY_KEYS.all, "detail"] as const,

  detail: (userId: number) =>
    [...USER_QUERY_KEYS.details(), userId] as const,
};