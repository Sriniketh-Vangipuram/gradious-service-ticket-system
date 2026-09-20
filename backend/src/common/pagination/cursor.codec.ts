import { AppError } from "../errors/app-error";

export type TicketSort = "newest" | "oldest";

export type TicketCursor = {
  v: 1;
  createdAt: string;
  id: number;
  sort: TicketSort;
};

type CursorPayload = {
  v?: unknown;
  createdAt?: unknown;
  id?: unknown;
  sort?: unknown;
};

function isTicketSort(value: unknown): value is TicketSort {
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

export function encodeCursor(cursor: TicketCursor): string {
  const payload = JSON.stringify(cursor);

  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): TicketCursor {
  try {
    // Reject empty, oversized, or invalid base64url input.
    if (
      cursor.length === 0 ||
      cursor.length > 512 ||
      !/^[A-Za-z0-9_-]+$/.test(cursor)
    ) {
      return invalidCursor();
    }

    const decoded = Buffer.from(cursor, "base64url").toString("utf8");

    // Buffer decoding is permissive; require canonical encoding.
    if (Buffer.from(decoded, "utf8").toString("base64url") !== cursor) {
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

    const value = payload as CursorPayload;

    if (
      value.v !== 1 ||
      typeof value.createdAt !== "string" ||
      !Number.isSafeInteger(value.id) ||
      (value.id as number) <= 0 ||
      !isTicketSort(value.sort)
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