import { useQueryClient } from "@tanstack/react-query";

import { logoutUser } from "../api/auth.api";
import {
  AUTH_QUERY_KEYS,
  useCurrentUser,
} from "./useCurrentUser";

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useCurrentUser();

  const user = data?.data.user ?? null;

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      queryClient.removeQueries({
        queryKey: AUTH_QUERY_KEYS.currentUser,
      });
    }
  };

  return {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    isError,
    error,
    logout,
  };
}