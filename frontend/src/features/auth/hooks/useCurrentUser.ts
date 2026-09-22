import { useQuery } from "@tanstack/react-query";

import { getCurrentUser } from "../api/auth.api";
import {
  normalizeApiError,
  type ApiError,
} from "../../../lib/api/api-error";

export const AUTH_QUERY_KEYS = {
  currentUser: ["auth", "current-user"] as const,
};

export function useCurrentUser() {
  const query = useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const error: ApiError | null = query.error
    ? normalizeApiError(query.error)
    : null;

  const user = query.data?.data.user ?? null;

  return {
    ...query,

    user,
    error,

    isAuthenticated: Boolean(user),
    isUnauthenticated:
      error?.code === "UNAUTHENTICATED",
  };
}