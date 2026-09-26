import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCenter,
  updateCenter,
  updateCenterStatus,
} from "../api/centerService";

import { CENTER_QUERY_KEYS } from "../api/center.keys";

/* -------------------------------------------------------------------------- */
/* Create center                                                              */
/* -------------------------------------------------------------------------- */

export function useCreateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCenter,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CENTER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update center                                                              */
/* -------------------------------------------------------------------------- */

export function useUpdateCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: number;
      payload: Parameters<typeof updateCenter>[1];
    }) => updateCenter(centerId, payload),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: CENTER_QUERY_KEYS.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: CENTER_QUERY_KEYS.detail(
            variables.centerId,
          ),
        }),
      ]);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update center status                                                       */
/* -------------------------------------------------------------------------- */

export function useUpdateCenterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: number;
      payload: Parameters<typeof updateCenterStatus>[1];
    }) => updateCenterStatus(centerId, payload),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: CENTER_QUERY_KEYS.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: CENTER_QUERY_KEYS.detail(
            variables.centerId,
          ),
        }),
      ]);
    },
  });
}