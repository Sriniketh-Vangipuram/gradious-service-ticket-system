import type { UserRole } from "../../auth/types/auth.types";

export const COMMENT_QUERY_KEYS = {
  all: ["ticket-comments"] as const,

  lists: () => [...COMMENT_QUERY_KEYS.all, "list"] as const,

  list: (
    ticketId: number,
    userId: number,
    role: UserRole,
  ) =>
    [
      ...COMMENT_QUERY_KEYS.lists(),
      ticketId,
      userId,
      role,
    ] as const,
};