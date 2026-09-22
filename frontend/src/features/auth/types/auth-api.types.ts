import type { AuthUser, CurrentUser } from "./auth.types";



export interface LoginRequest{
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}


export interface AuthSuccessResponse<T> {
  success: true;
  data: T;
}

export type LoginResponse = AuthSuccessResponse<{
  user: AuthUser;
}>;

export type RegisterResponse = AuthSuccessResponse<{
  user: AuthUser;
}>;

export type RefreshResponse = AuthSuccessResponse<{
  user: AuthUser;
}>;

export type MeResponse = AuthSuccessResponse<{
  user: CurrentUser;
}>;

export type LogoutResponse = AuthSuccessResponse<{
  message: string;
}>;


