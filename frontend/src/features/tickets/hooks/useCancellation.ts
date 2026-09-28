import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  approveTicketCancellationRequest,
  rejectTicketCancellationRequest,
  requestTicketCancellation,
} from "../api/ticket.api";

import { TICKET_QUERY_KEYS } from "../api/ticket.keys";

import type {
  RequestCancellationRequest,
  ReviewCancellationRequest,
} from "../types/ticket-api.types";

interface RequestTicketCancellationVariables {
  ticketId: number;
  payload: RequestCancellationRequest;
}

export function useRequestTicketCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: RequestTicketCancellationVariables) =>
      requestTicketCancellation(ticketId, payload),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(
            variables.ticketId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.lists(),
        }),
      ]);
    },
  });
}

interface ApproveTicketCancellationVariables {
  ticketId: number;
  historyId: number;
}

export function useApproveTicketCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      historyId,
    }: ApproveTicketCancellationVariables) =>
      approveTicketCancellationRequest(
        ticketId,
        historyId,
      ),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(
            variables.ticketId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.lists(),
        }),
      ]);
    },
  });
}

interface RejectTicketCancellationVariables {
  ticketId: number;
  historyId: number;
  payload: ReviewCancellationRequest;
}

export function useRejectTicketCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      historyId,
      payload,
    }: RejectTicketCancellationVariables) =>
      rejectTicketCancellationRequest(
        ticketId,
        historyId,
        payload,
      ),

    retry: false,

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.detail(
            variables.ticketId,
          ),
        }),

        queryClient.invalidateQueries({
          queryKey: TICKET_QUERY_KEYS.lists(),
        }),
      ]);
    },
  });
}