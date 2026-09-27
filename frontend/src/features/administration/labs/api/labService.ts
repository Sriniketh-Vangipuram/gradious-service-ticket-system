import { httpClient } from "../../../../lib/api/http-client";

import type {
  CreateLabInput,
  LabListResponse,
  LabResponse,
  LabFilters,
  UpdateLabInput,
  UpdateLabStatusInput,
} from "../types/lab.types";

/* -------------------------------------------------------------------------- */
/* List labs                                                                  */
/* -------------------------------------------------------------------------- */

export async function getLabs(
  params?: LabFilters,
): Promise<LabListResponse> {
  const response =
    await httpClient.get<LabListResponse>(
      "/labs",
      {
        params,
      },
    );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Get lab by ID                                                              */
/* -------------------------------------------------------------------------- */

export async function getLabById(
  labId: number,
): Promise<LabResponse> {
  const response =
    await httpClient.get<LabResponse>(
      `/labs/${labId}`,
    );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Create lab                                                                 */
/* -------------------------------------------------------------------------- */

export async function createLab(
  payload: CreateLabInput,
): Promise<LabResponse> {
  const response =
    await httpClient.post<LabResponse>(
      "/labs",
      payload,
    );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update lab                                                                 */
/* -------------------------------------------------------------------------- */

export async function updateLab(
  labId: number,
  payload: UpdateLabInput,
): Promise<LabResponse> {
  const response =
    await httpClient.patch<LabResponse>(
      `/labs/${labId}`,
      payload,
    );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update lab status                                                          */
/* -------------------------------------------------------------------------- */

export async function updateLabStatus(
  labId: number,
  payload: UpdateLabStatusInput,
): Promise<LabResponse> {
  const response =
    await httpClient.patch<LabResponse>(
      `/labs/${labId}/status`,
      payload,
    );

  return response.data;
}