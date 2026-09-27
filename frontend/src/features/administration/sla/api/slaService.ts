import {httpClient} from "../../../../lib/api/http-client";

import type {
  SlaOverviewFilters,
  SlaOverviewResponse,
  SlaPolicyResponse,
  SlaPoliciesResponse,
  SlaTicketFilters,
  SlaTicketsResponse,
  UpdateSlaPolicyStatusInput,
  UpsertSlaPolicyInput,
  TicketPriority,
} from "../types/sla.types";

export const slaService = {
  /* ---------------------------------------------------------------------- */
  /* SLA Overview                                                           */
  /* ---------------------------------------------------------------------- */

  async getOverview(
    params?: SlaOverviewFilters,
  ): Promise<SlaOverviewResponse> {
    const response =
      await httpClient.get<SlaOverviewResponse>(
        "/sla/overview",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* SLA Tickets                                                             */
  /* ---------------------------------------------------------------------- */

  async getTickets(
    params?: SlaTicketFilters,
  ): Promise<SlaTicketsResponse> {
    const response =
      await httpClient.get<SlaTicketsResponse>(
        "/sla/tickets",
        {
          params,
        },
      );

    return response.data;
  },

  /* ---------------------------------------------------------------------- */
  /* SLA Policies                                                            */
  /* ---------------------------------------------------------------------- */

  async getPolicies(): Promise<SlaPoliciesResponse> {
    const response =
      await httpClient.get<SlaPoliciesResponse>(
        "/sla/policies",
      );

    return response.data;
  },

  async getPolicy(
    priority: TicketPriority,
  ): Promise<SlaPolicyResponse> {
    const response =
      await httpClient.get<SlaPolicyResponse>(
        `/sla/policies/${priority}`,
      );

    return response.data;
  },

  async upsertPolicy(
    priority: TicketPriority,
    payload: UpsertSlaPolicyInput,
  ): Promise<SlaPolicyResponse> {
    const response =
      await httpClient.put<SlaPolicyResponse>(
        `/sla/policies/${priority}`,
        payload,
      );

    return response.data;
  },

  async updatePolicyStatus(
    priority: TicketPriority,
    payload: UpdateSlaPolicyStatusInput,
  ): Promise<SlaPolicyResponse> {
    const response =
      await httpClient.patch<SlaPolicyResponse>(
        `/sla/policies/${priority}/status`,
        payload,
      );

    return response.data;
  },
};