import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { softwareService } from "../api/softwareService";
import { SOFTWARE_QUERY_KEYS } from "../api/software.keys";

import type {
  CreateSoftwareInput,
  UpdateSoftwareInput,
  UpdateSoftwareStatusInput,
} from "../types/software.types";

export const useSoftwareMutations = () => {
  const queryClient = useQueryClient();

  const createSoftwareMutation =
    useMutation({
      mutationFn: (
        payload: CreateSoftwareInput,
      ) =>
        softwareService.createSoftware(
          payload,
        ),

      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            SOFTWARE_QUERY_KEYS.lists(),
        });
      },
    });

  const updateSoftwareMutation =
    useMutation({
      mutationFn: ({
        softwareId,
        payload,
      }: {
        softwareId: number;
        payload: UpdateSoftwareInput;
      }) =>
        softwareService.updateSoftware(
          softwareId,
          payload,
        ),

      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey:
            SOFTWARE_QUERY_KEYS.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SOFTWARE_QUERY_KEYS.detail(
              variables.softwareId,
            ),
        });
      },
    });

  const updateSoftwareStatusMutation =
    useMutation({
      mutationFn: ({
        softwareId,
        payload,
      }: {
        softwareId: number;
        payload: UpdateSoftwareStatusInput;
      }) =>
        softwareService.updateSoftwareStatus(
          softwareId,
          payload,
        ),

      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey:
            SOFTWARE_QUERY_KEYS.lists(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SOFTWARE_QUERY_KEYS.detail(
              variables.softwareId,
            ),
        });
      },
    });

  return {
    createSoftwareMutation,
    updateSoftwareMutation,
    updateSoftwareStatusMutation,
  };
};
