export const SOFTWARE_QUERY_KEYS = {
  all: ["software"] as const,

  lists: () =>
    [...SOFTWARE_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...SOFTWARE_QUERY_KEYS.lists(), params] as const,

  details: () =>
    [...SOFTWARE_QUERY_KEYS.all, "detail"] as const,

  detail: (softwareId: number) =>
    [...SOFTWARE_QUERY_KEYS.details(), softwareId] as const,
};
