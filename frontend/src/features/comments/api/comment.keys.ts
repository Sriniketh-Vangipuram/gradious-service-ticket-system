export const COMMENT_QUERY_KEYS = {
  all: ["ticket-comments"] as const,

  lists: () => [...COMMENT_QUERY_KEYS.all, "list"] as const,

  list: (ticketId: number) =>
    [...COMMENT_QUERY_KEYS.lists(), ticketId] as const,
};