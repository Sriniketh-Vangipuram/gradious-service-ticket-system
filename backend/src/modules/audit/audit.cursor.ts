import { AppError } from "../../common/errors/app-error";
import type {
  AuditLogCursor,
  AuditLogSort,
} from "./audit.types";

type AuditCursorPayload = {
  v?: unknown;
  createdAt?: unknown;
  id?: unknown;
  sort?: unknown;
};

function isAuditLogSort(value: unknown): value is AuditLogSort {
  return value === "newest" || value === "oldest";
}

function invalidCursor(): never {
  throw new AppError(
    "VALIDATION_ERROR",
    "Invalid pagination cursor.",
    [
      {
        field: "query.cursor",
        message: "Cursor is malformed or invalid.",
      },
    ],
  );
}

export function encodeAuditCursor(
  cursor: AuditLogCursor,
): string {
  const payload = JSON.stringify(cursor);

  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeAuditCursor(
  cursor: string,
): AuditLogCursor {
  try {
    if (
      cursor.length === 0 ||
      cursor.length > 512 ||
      !/^[A-Za-z0-9_-]+$/.test(cursor)
    ) {
      return invalidCursor();
    }

    const decoded = Buffer.from(cursor, "base64url").toString("utf8");

    if (
      Buffer.from(decoded, "utf8").toString("base64url") !== cursor
    ) {
      return invalidCursor();
    }

    const payload: unknown = JSON.parse(decoded);

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return invalidCursor();
    }

    const value = payload as AuditCursorPayload;

    if (
      value.v !== 1 ||
      typeof value.createdAt !== "string" ||
      !Number.isSafeInteger(value.id) ||
      (value.id as number) <= 0 ||
      !isAuditLogSort(value.sort)
    ) {
      return invalidCursor();
    }

    const timestamp = new Date(value.createdAt);

    if (
      Number.isNaN(timestamp.getTime()) ||
      timestamp.toISOString() !== value.createdAt
    ) {
      return invalidCursor();
    }

    return {
      v: 1,
      createdAt: value.createdAt,
      id: value.id as number,
      sort: value.sort,
    };
  } catch {
    return invalidCursor();
  }
}