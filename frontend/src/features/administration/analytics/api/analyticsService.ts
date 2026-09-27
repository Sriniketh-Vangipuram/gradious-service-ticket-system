import { httpClient } from "../../../../lib/api/http-client";

import type {
  AnalyticsFilters,
  AnalyticsOverviewResponse,
  TicketVolumeResponse,
  TicketTrendsResponse,
  BreakdownResponse,
  PriorityBreakdownResponse,
  SlaComplianceResponse,
  TimeMetricResponse,
  TechnicianWorkloadResponse,
  ResolutionRateResponse,
  AnalyticsTrendFilters,
} from "../types/analytics.types";

export const analyticsService = {
  /* ---------------------------------------------------------------------- */
  /* Analytics Overview                                                      */
  /* ---------------------------------------------------------------------- */

  async getOverview(
    params: AnalyticsFilters,
  ): Promise<AnalyticsOverviewResponse> {
    const response =
      await httpClient.get<AnalyticsOverviewResponse>(
        "/analytics/overview",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Ticket Volume                                                           */
  /* ---------------------------------------------------------------------- */

  async getTicketVolume(
    params: AnalyticsFilters,
  ): Promise<TicketVolumeResponse> {
    const response =
      await httpClient.get<TicketVolumeResponse>(
        "/analytics/ticket-volume",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Ticket Trends                                                           */
  /* ---------------------------------------------------------------------- */

  async getTicketTrends(
    params: AnalyticsTrendFilters,
  ): Promise<TicketTrendsResponse> {
    const response =
      await httpClient.get<TicketTrendsResponse>(
        "/analytics/ticket-trends",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Center Breakdown                                                        */
  /* ---------------------------------------------------------------------- */

  async getByCenter(
    params: AnalyticsFilters,
  ): Promise<BreakdownResponse> {
    const response =
      await httpClient.get<BreakdownResponse>(
        "/analytics/by-center",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Category Breakdown                                                      */
  /* ---------------------------------------------------------------------- */

  async getByCategory(
    params: AnalyticsFilters,
  ): Promise<BreakdownResponse> {
    const response =
      await httpClient.get<BreakdownResponse>(
        "/analytics/by-category",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Priority Breakdown                                                      */
  /* ---------------------------------------------------------------------- */

  async getByPriority(
    params: AnalyticsFilters,
  ): Promise<PriorityBreakdownResponse> {
    const response =
      await httpClient.get<PriorityBreakdownResponse>(
        "/analytics/by-priority",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* SLA Compliance                                                          */
  /* ---------------------------------------------------------------------- */

  async getSlaCompliance(
    params: AnalyticsFilters,
  ): Promise<SlaComplianceResponse> {
    const response =
      await httpClient.get<SlaComplianceResponse>(
        "/analytics/sla-compliance",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Average Response Time                                                   */
  /* ---------------------------------------------------------------------- */

  async getResponseTime(
    params: AnalyticsFilters,
  ): Promise<TimeMetricResponse> {
    const response =
      await httpClient.get<TimeMetricResponse>(
        "/analytics/response-time",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Average Resolution Time                                                 */
  /* ---------------------------------------------------------------------- */

  async getResolutionTime(
    params: AnalyticsFilters,
  ): Promise<TimeMetricResponse> {
    const response =
      await httpClient.get<TimeMetricResponse>(
        "/analytics/resolution-time",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Technician Workload                                                     */
  /* ---------------------------------------------------------------------- */

  async getTechnicianWorkload(
    params: AnalyticsFilters,
  ): Promise<TechnicianWorkloadResponse> {
    const response =
      await httpClient.get<TechnicianWorkloadResponse>(
        "/analytics/technician-workload",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* Resolution Rate                                                         */
  /* ---------------------------------------------------------------------- */

  async getResolutionRate(
    params: AnalyticsFilters,
  ): Promise<ResolutionRateResponse> {
    const response =
      await httpClient.get<ResolutionRateResponse>(
        "/analytics/resolution-rate",
        {
          params,
        },
      );

    return response.data;
  },
};