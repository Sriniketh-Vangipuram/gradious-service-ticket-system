import {
  useQuery,
} from "@tanstack/react-query";

import {
  analyticsService,
} from "../api/analyticsService";

import {
  ANALYTICS_QUERY_KEYS,
} from "../api/analytics.keys";

import type {
  AnalyticsFilters,
  AnalyticsTrendFilters,
} from "../types/analytics.types";

/* -------------------------------------------------------------------------- */
/* Analytics Overview                                                         */
/* -------------------------------------------------------------------------- */

export function useAnalyticsOverview(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.overviewWithFilters(params),

    queryFn: () =>
      analyticsService.getOverview(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Ticket Volume                                                              */
/* -------------------------------------------------------------------------- */

export function useTicketVolume(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.ticketVolumeWithFilters(params),

    queryFn: () =>
      analyticsService.getTicketVolume(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Ticket Trends                                                              */
/* -------------------------------------------------------------------------- */

export function useTicketTrends(
  params: AnalyticsTrendFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.ticketTrendsWithFilters(params),

    queryFn: () =>
      analyticsService.getTicketTrends(params),

    enabled: Boolean(
      params.from &&
      params.to &&
      params.granularity,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Center Breakdown                                                           */
/* -------------------------------------------------------------------------- */

export function useAnalyticsByCenter(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.byCenterWithFilters(params),

    queryFn: () =>
      analyticsService.getByCenter(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Category Breakdown                                                         */
/* -------------------------------------------------------------------------- */

export function useAnalyticsByCategory(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.byCategoryWithFilters(params),

    queryFn: () =>
      analyticsService.getByCategory(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Priority Breakdown                                                         */
/* -------------------------------------------------------------------------- */

export function useAnalyticsByPriority(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.byPriorityWithFilters(params),

    queryFn: () =>
      analyticsService.getByPriority(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* SLA Compliance                                                             */
/* -------------------------------------------------------------------------- */

export function useAnalyticsSlaCompliance(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.slaComplianceWithFilters(params),

    queryFn: () =>
      analyticsService.getSlaCompliance(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Average Response Time                                                      */
/* -------------------------------------------------------------------------- */

export function useAnalyticsResponseTime(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.responseTimeWithFilters(params),

    queryFn: () =>
      analyticsService.getResponseTime(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Average Resolution Time                                                    */
/* -------------------------------------------------------------------------- */

export function useAnalyticsResolutionTime(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.resolutionTimeWithFilters(params),

    queryFn: () =>
      analyticsService.getResolutionTime(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Technician Workload                                                        */
/* -------------------------------------------------------------------------- */

export function useTechnicianWorkload(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.technicianWorkloadWithFilters(params),

    queryFn: () =>
      analyticsService.getTechnicianWorkload(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}

/* -------------------------------------------------------------------------- */
/* Resolution Rate                                                            */
/* -------------------------------------------------------------------------- */

export function useAnalyticsResolutionRate(
  params: AnalyticsFilters,
) {
  return useQuery({
    queryKey:
      ANALYTICS_QUERY_KEYS.resolutionRateWithFilters(params),

    queryFn: () =>
      analyticsService.getResolutionRate(params),

    enabled: Boolean(
      params.from &&
      params.to,
    ),
  });
}