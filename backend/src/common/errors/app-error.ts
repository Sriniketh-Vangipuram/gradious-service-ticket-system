export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type ErrorDetail = {
  field: string;
  message: string;
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly details?: ErrorDetail[];

  constructor(
    code: AppErrorCode,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}