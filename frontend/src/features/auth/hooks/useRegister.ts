import { useMutation, useQueryClient } from "@tanstack/react-query";

import { registerUser } from "../api/auth.api";
import type { RegisterRequest } from "../types/auth-api.types";
import { AUTH_QUERY_KEYS } from "./useCurrentUser";
import {
  normalizeApiError,
  type ApiError,
} from "../../../lib/api/api-error";

export function useRegister() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: RegisterRequest) =>
      registerUser(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: AUTH_QUERY_KEYS.currentUser,
      });
    },
  });

  const error: ApiError | null = mutation.error
    ? normalizeApiError(mutation.error)
    : null;

  return {
    ...mutation,
    error,
  };
}