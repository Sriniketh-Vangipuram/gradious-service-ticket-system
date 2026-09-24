import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/database";

import { AppError } from "../../common/errors/app-error";

import {
  decodeAuditCursor,
  encodeAuditCursor,
} from "./audit.cursor";

import type {
  AuditLogCursor,
  AuditLogListFilters,
  AuditLogListItem,
  AuditLogListResult,
  CreateAuditLogInput,
} from "./audit.types";

type AuditDb = Prisma.TransactionClient | typeof prisma;

/**
 * Fields that must never be persisted in audit snapshots.
 *
 * Audit logs are security-sensitive records, so authentication
 * credentials and secrets must never enter oldValue/newValue/metadata.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "accessToken",
  "refreshToken",
  "token",
  "secret",
  "clientSecret",
]);

function sanitizeAuditValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.has(key)) {
        sanitized[key] = "[REDACTED]";
        continue;
      }

      sanitized[key] = sanitizeAuditValue(childValue);
    }

    return sanitized;
  }

  return value;
}

function toPrismaJson(
  value: unknown,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  const sanitized = sanitizeAuditValue(value);

  if (sanitized === null) {
    return {};
  }

  return sanitized as Prisma.InputJsonValue;
}

/**
 * Creates an audit record.
 *
 * This function accepts an optional Prisma transaction client so that
 * business mutations and their audit records can commit or rollback
 * together.
 */
export async function createAuditLog(
  input: CreateAuditLogInput,
  db: AuditDb = prisma,
) {
  return db.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,

      actorId: input.actorId ?? null,

      oldValue: toPrismaJson(input.oldValue),
      newValue: toPrismaJson(input.newValue),
      metadata: toPrismaJson(input.metadata),

      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/**
 * Lists audit logs using stable cursor pagination.
 *
 * Ordering:
 *   newest -> createdAt DESC, id DESC
 *   oldest -> createdAt ASC,  id ASC
 *
 * `id` is the deterministic tie-breaker when multiple audit logs
 * have the exact same createdAt timestamp.
 */
export async function listAuditLogs(
  filters: AuditLogListFilters,
  db: AuditDb = prisma,
): Promise<AuditLogListResult> {
  const {
    actorId,
    action,
    entityType,
    entityId,
    from,
    to,
    limit,
    cursor,
  } = filters;

  const sort = cursor?.sort ?? "newest";

  const where: Prisma.AuditLogWhereInput = {};

  if (actorId !== undefined) {
    where.actorId = actorId;
  }

  if (action !== undefined) {
    where.action = action;
  }

  if (entityType !== undefined) {
    where.entityType = entityType;
  }

  if (entityId !== undefined) {
    where.entityId = entityId;
  }

  if (from !== undefined || to !== undefined) {
    where.createdAt = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    };
  }

  if (cursor) {
    const cursorCreatedAt = new Date(cursor.createdAt);

    if (sort === "newest") {
      where.OR = [
        {
          createdAt: {
            lt: cursorCreatedAt,
          },
        },
        {
          createdAt: cursorCreatedAt,
          id: {
            lt: cursor.id,
          },
        },
      ];
    } else {
      where.OR = [
        {
          createdAt: {
            gt: cursorCreatedAt,
          },
        },
        {
          createdAt: cursorCreatedAt,
          id: {
            gt: cursor.id,
          },
        },
      ];
    }
  }

  const items = await db.auditLog.findMany({
    where,

    orderBy:
      sort === "newest"
        ? [
            { createdAt: "desc" },
            { id: "desc" },
          ]
        : [
            { createdAt: "asc" },
            { id: "asc" },
          ],

    take: limit + 1,

    select: {
      id: true,

      action: true,
      entityType: true,
      entityId: true,

      oldValue: true,
      newValue: true,
      metadata: true,

      ipAddress: true,
      userAgent: true,

      createdAt: true,

      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  const hasNextPage = items.length > limit;

  const pageItems = hasNextPage
    ? items.slice(0, limit)
    : items;

  const lastItem = pageItems.at(-1);

  const nextCursor =
    hasNextPage && lastItem
      ? encodeAuditCursor({
          v: 1,
          createdAt: lastItem.createdAt.toISOString(),
          id: lastItem.id,
          sort,
        })
      : null;

  return {
    items: pageItems as AuditLogListItem[],
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}

/**
 * Retrieves a single audit record.
 */
export async function getAuditLogById(
  id: number,
  db: AuditDb = prisma,
): Promise<AuditLogListItem> {
  const auditLog = await db.auditLog.findUnique({
    where: {
      id,
    },

    select: {
      id: true,

      action: true,
      entityType: true,
      entityId: true,

      oldValue: true,
      newValue: true,
      metadata: true,

      ipAddress: true,
      userAgent: true,

      createdAt: true,

      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  if (!auditLog) {
    throw new AppError(
      "NOT_FOUND",
      "Audit log was not found.",
    );
  }

  return auditLog as AuditLogListItem;
}