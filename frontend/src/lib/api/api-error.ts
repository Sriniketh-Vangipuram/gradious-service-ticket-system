import axios from "axios";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiError {
  status: number | null;
  code: ApiErrorCode;
  message: string;
}

export function normalizeApiError(
  error: unknown,
): ApiError {
  if (!axios.isAxiosError(error)) {
    return {
      status: null,
      code: "UNKNOWN_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }

  if (!error.response) {
    return {
      status: null,
      code: "NETWORK_ERROR",
      message:
        "Unable to connect to the server. Please check your connection and try again.",
    };
  }

  const { status } = error.response;

  const responseData =
    error.response.data as Partial<ApiErrorResponse>;

  const backendMessage =
   responseData?.error?.message;

  switch (status) {
    case 400:
      return {
        status,
        code: "BAD_REQUEST",
        message:
          backendMessage??
          "The request could not be processed. Please check your information.",
      };

    case 401:
      return {
        status,
        code: "UNAUTHENTICATED",
        message:
           backendMessage??
          "Invalid email or password.",
      };

    case 403:
      return {
        status,
        code: "FORBIDDEN",
        message:
        backendMessage??
          "You do not have permission to access this account.",
      };

    case 404:
      return {
        status,
        code: "NOT_FOUND",
        message:
        backendMessage??
          "The requested resource could not be found.",
      };

    case 409:
    return {
        status,
        code: "CONFLICT",
        message: 
        backendMessage??
        "Email is already registered.",
    };

    case 429:
      return {
        status,
        code: "RATE_LIMITED",
        message:
        backendMessage??
          "Too many attempts. Please wait a moment and try again.",
      };

    default:
      if (status >= 500) {
        return {
          status,
          code: "SERVER_ERROR",
          message:
          backendMessage??
            "The service is temporarily unavailable. Please try again later.",
        };
      }

      return {
        status,
        code: "UNKNOWN_ERROR",
        message:
          "Something went wrong. Please try again.",
      };
  }
}