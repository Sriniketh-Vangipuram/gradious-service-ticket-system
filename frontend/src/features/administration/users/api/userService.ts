import { httpClient } from "../../../../lib/api/http-client";

import type {
  AdministrationUser,
  TechnicianSpecialization,
  UsersResponse,
  UserCenterSummary,
  UserLabSummary,
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

/* -------------------------------------------------------------------------- */
/* Create user                                                                */
/* -------------------------------------------------------------------------- */

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: AdministrationUser["role"];
  primaryCenterId?: number;
}

export interface CreateUserResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: AdministrationUser["role"];
    isActive: boolean;
    center: UserCenterSummary | null;
    lab: UserLabSummary | null;
  };
}

export async function createUser(
  payload: CreateUserRequest,
): Promise<AdministrationUser> {
  const response = await httpClient.post<{
    success: boolean;
    data: {
      user: AdministrationUser;
    };
  }>("/users", payload);

  return response.data.data.user;
}

/* -------------------------------------------------------------------------- */
/* Update user profile                                                        */
/* -------------------------------------------------------------------------- */

export interface UpdateUserProfileRequest {
  fullName?: string;
  email?: string;
}

export async function updateUserProfile(
  userId: number,
  payload: UpdateUserProfileRequest,
): Promise<AdministrationUser> {
  const response = await httpClient.patch<{
    success: boolean;
    data: AdministrationUser;
  }>(
    `/users/${userId}`,
    payload,
  );

  return response.data.data;
}

/* -------------------------------------------------------------------------- */
/* Update user status                                                         */
/* -------------------------------------------------------------------------- */

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export async function updateUserStatus(
  userId: number,
  payload: UpdateUserStatusRequest,
): Promise<AdministrationUser> {
  const response = await httpClient.patch<{
    success: boolean;
    data: AdministrationUser;
  }>(
    `/users/${userId}/status`,
    payload,
  );

  return response.data.data;
}

/* -------------------------------------------------------------------------- */
/* Update primary center                                                      */
/* -------------------------------------------------------------------------- */

export interface UpdateUserPrimaryCenterRequest {
  centerId: number;
}

export async function updateUserPrimaryCenter(
  userId: number,
  payload: UpdateUserPrimaryCenterRequest,
): Promise<AdministrationUser> {
  const response = await httpClient.patch<{
    success: boolean;
    data: AdministrationUser;
  }>(
    `/users/${userId}/primary-center`,
    payload,
  );

  return response.data.data;
}

/* -------------------------------------------------------------------------- */
/* Update user lab                                                            */
/* -------------------------------------------------------------------------- */

export interface UpdateUserLabRequest {
  labId: number;
}

export async function updateUserLab(
  userId: number,
  payload: UpdateUserLabRequest,
): Promise<AdministrationUser> {
  const response = await httpClient.patch<{
    success: boolean;
    data: AdministrationUser;
  }>(
    `/users/${userId}/lab`,
    payload,
  );

  return response.data.data;
}