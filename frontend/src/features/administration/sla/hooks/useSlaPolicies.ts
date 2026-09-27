import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { slaService } from "../api/slaService";
import { SLA_QUERY_KEYS } from "../api/sla.keys";

import type {
  TicketPriority,
  UpsertSlaPolicyInput,
  UpdateSlaPolicyStatusInput,
} from "../types/sla.types";

export function useSlaPolicies() {
  return useQuery({
    queryKey: SLA_QUERY_KEYS.policies(),

    queryFn: () =>
      slaService.getPolicies(),

    staleTime: 60 * 1000,
  });
}

export function useSlaPolicy(
  priority: TicketPriority,
) {
  return useQuery({
    queryKey:
      SLA_QUERY_KEYS.policy(priority),

    queryFn: () =>
      slaService.getPolicy(priority),

    staleTime: 60 * 1000,
  });
}

export function useSlaPolicyMutations() {
  const queryClient =
    useQueryClient();

  const upsertPolicyMutation =
    useMutation({
      mutationFn: ({
        priority,
        payload,
      }: {
        priority: TicketPriority;
        payload: UpsertSlaPolicyInput;
      }) =>
        slaService.upsertPolicy(
          priority,
          payload,
        ),

      onSuccess: (
        _data,
        variables,
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.policies(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.policy(
              variables.priority,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.overview(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.tickets(),
        });
      },
    });

  const updatePolicyStatusMutation =
    useMutation({
      mutationFn: ({
        priority,
        payload,
      }: {
        priority: TicketPriority;
        payload: UpdateSlaPolicyStatusInput;
      }) =>
        slaService.updatePolicyStatus(
          priority,
          payload,
        ),

      onSuccess: (
        _data,
        variables,
      ) => {
        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.policies(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.policy(
              variables.priority,
            ),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.overview(),
        });

        queryClient.invalidateQueries({
          queryKey:
            SLA_QUERY_KEYS.tickets(),
        });
      },
    });

  return {
    upsertPolicyMutation,
    updatePolicyStatusMutation,
  };
}