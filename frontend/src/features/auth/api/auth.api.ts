import { httpClient } from "../../../lib/api/http-client";

import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  LogoutResponse,
  MeResponse,
} from "../types/auth-api.types";



export async function registerUser(
  payload:RegisterRequest
):Promise<RegisterResponse>{
  
  const response = await httpClient.post<RegisterResponse>(
    "/auth/register",
    payload,
  );

  return response.data;
}

export async function loginUser(
  payload:LoginRequest
): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>(
    "/auth/login",
    payload,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<MeResponse> {
  const response = await httpClient.get<MeResponse>(
    "/auth/me",
  );

  return response.data;
}

export async function logoutUser(): Promise<LogoutResponse> {
  const response = await httpClient.post<LogoutResponse>(
    "/auth/logout",
  );

  return response.data;
}