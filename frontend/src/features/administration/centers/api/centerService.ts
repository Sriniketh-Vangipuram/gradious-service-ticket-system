import { httpClient } from "../../../../lib/api/http-client";

import type {
  CenterFilters,
  CenterListResponse,
  CenterResponse,
  CreateCenterInput,
  UpdateCenterInput,
  UpdateCenterStatusInput,
} from "../types/center.types";

/* -------------------------------------------------------------------------- */
/* List centers                                                               */
/* -------------------------------------------------------------------------- */

export async function getCenters(
  params?: CenterFilters,
): Promise<CenterListResponse> {
  const response = await httpClient.get<CenterListResponse>(
    "/centers",
    {
      params,
    },
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Get center by ID                                                           */
/* -------------------------------------------------------------------------- */

export async function getCenterById(
  centerId: number,
): Promise<CenterResponse> {
  const response = await httpClient.get<CenterResponse>(
    `/centers/${centerId}`,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Create center                                                              */
/* -------------------------------------------------------------------------- */

export async function createCenter(
  payload: CreateCenterInput,
): Promise<CenterResponse> {
  const response = await httpClient.post<CenterResponse>(
    "/centers",
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update center                                                              */
/* -------------------------------------------------------------------------- */

export async function updateCenter(
  centerId: number,
  payload: UpdateCenterInput,
): Promise<CenterResponse> {
  const response = await httpClient.patch<CenterResponse>(
    `/centers/${centerId}`,
    payload,
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update center status                                                       */
/* -------------------------------------------------------------------------- */

export async function updateCenterStatus(
  centerId: number,
  payload: UpdateCenterStatusInput,
): Promise<CenterResponse> {
  const response = await httpClient.patch<CenterResponse>(
    `/centers/${centerId}/status`,
    payload,
  );

  return response.data;
}