import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createLab,
  updateLab,
  updateLabStatus,
} from "../api/labService";

import { LAB_QUERY_KEYS } from "../api/lab.keys";

import type {
  CreateLabInput,
  UpdateLabInput,
  UpdateLabStatusInput,
} from "../types/lab.types";

/* -------------------------------------------------------------------------- */
/* Create lab                                                                 */
/* -------------------------------------------------------------------------- */

export function useCreateLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateLabInput,
    ) => createLab(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          LAB_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update lab                                                                 */
/* -------------------------------------------------------------------------- */

export function useUpdateLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      labId,
      payload,
    }: {
      labId: number;
      payload: UpdateLabInput;
    }) =>
      updateLab(
        labId,
        payload,
      ),

    onSuccess: async (
      _data,
      variables,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            LAB_QUERY_KEYS.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            LAB_QUERY_KEYS.detail(
              variables.labId,
            ),
        }),
      ]);
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update lab status                                                          */
/* -------------------------------------------------------------------------- */

export function useUpdateLabStatus() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      labId,
      payload,
    }: {
      labId: number;
      payload: UpdateLabStatusInput;
    }) =>
      updateLabStatus(
        labId,
        payload,
      ),

    onSuccess: async (
      _data,
      variables,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            LAB_QUERY_KEYS.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            LAB_QUERY_KEYS.detail(
              variables.labId,
            ),
        }),
      ]);
    },
  });
}