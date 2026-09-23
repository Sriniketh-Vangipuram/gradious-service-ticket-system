import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updateUserSpecializations,
  type UpdateUserSpecializationsRequest,
} from "../api/userService";

import { USER_QUERY_KEYS } from "../api/user.keys";

export function useUpdateUserSpecializations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      specializations,
    }: {
      userId: number;
      specializations: UpdateUserSpecializationsRequest["specializations"];
    }) =>
      updateUserSpecializations(userId, {
        specializations,
      }),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}