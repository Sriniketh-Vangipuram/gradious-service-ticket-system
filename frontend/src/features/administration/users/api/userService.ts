import { httpClient } from "../../../../lib/api/http-client";

import type {
  AdministrationUser,
  TechnicianSpecialization,
  UsersResponse,
} from "../types/user.types";

/* -------------------------------------------------------------------------- */
/* List users                                                                 */
/* -------------------------------------------------------------------------- */

export interface ListUsersParams {
  search?: string;
  role?: AdministrationUser["role"];
  centerId?: number;
  labId?: number;
  specialization?: TechnicianSpecialization;
  isActive?: boolean;
  cursor?: number;
  limit?: number;
}

export async function getUsers(
  params?: ListUsersParams,
): Promise<UsersResponse> {
  const response = await httpClient.get<UsersResponse>(
    "/users",
    {
      params,
    },
  );

  return response.data;
}

/* -------------------------------------------------------------------------- */
/* Update technician specializations                                          */
/* -------------------------------------------------------------------------- */

export interface UpdateUserSpecializationsRequest {
  specializations: TechnicianSpecialization[];
}
export interface UpdateUserSpecializationsResponse {
  userId: number;
  specializations: TechnicianSpecialization[];
}

export async function updateUserSpecializations(
  userId: number,
  payload: UpdateUserSpecializationsRequest,
): Promise<UpdateUserSpecializationsResponse> {
  const response = await httpClient.put<{
    success: boolean;
    data: UpdateUserSpecializationsResponse;
  }>(
    `/users/${userId}/specializations`,
    payload,
  );

  return response.data.data;
}