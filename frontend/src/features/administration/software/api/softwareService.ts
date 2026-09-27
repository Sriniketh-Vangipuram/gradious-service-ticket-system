import {httpClient} from "../../../../lib/api/http-client";

import type {
  CreateSoftwareInput,
  SoftwareFilters,
  SoftwareListResponse,
  SoftwareResponse,
  UpdateSoftwareInput,
  UpdateSoftwareStatusInput,
} from "../types/software.types";

export const softwareService = {
  async getSoftware(
    params?: SoftwareFilters,
  ): Promise<SoftwareListResponse> {
    const response =
      await httpClient.get<SoftwareListResponse>(
        "/software",
        {
          params,
        },
      );

    return response.data;
  },

  async getSoftwareById(
    softwareId: number,
  ): Promise<SoftwareResponse> {
    const response =
      await httpClient.get<SoftwareResponse>(
        `/software/${softwareId}`,
      );

    return response.data;
  },

  async createSoftware(
    payload: CreateSoftwareInput,
  ): Promise<SoftwareResponse> {
    const response =
      await httpClient.post<SoftwareResponse>(
        "/software",
        payload,
      );

    return response.data;
  },

  async updateSoftware(
    softwareId: number,
    payload: UpdateSoftwareInput,
  ): Promise<SoftwareResponse> {
    const response =
      await httpClient.patch<SoftwareResponse>(
        `/software/${softwareId}`,
        payload,
      );

    return response.data;
  },

  async updateSoftwareStatus(
    softwareId: number,
    payload: UpdateSoftwareStatusInput,
  ): Promise<SoftwareResponse> {
    const response =
      await httpClient.patch<SoftwareResponse>(
        `/software/${softwareId}/status`,
        payload,
      );

    return response.data;
  },
};