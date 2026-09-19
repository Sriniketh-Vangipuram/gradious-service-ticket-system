import type { Response } from "express";
import type { CursorPaginatedData } from "./pagination.types";
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendCursorPaginatedSuccess<T>(
  res: Response,
  data: CursorPaginatedData<T>,
): void {
  sendSuccess(res, data);
}