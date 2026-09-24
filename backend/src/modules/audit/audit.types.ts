import type { AuditAction } from "../../generated/prisma/enums";

export type AuditEntityType =
  | "USER"
  | "CENTER"
  | "LAB"
  | "CATEGORY"
  | "SOFTWARE"
  | "TICKET"
  | "SLA_POLICY"
  | "AUTHENTICATION";

export type AuditLogSort = "newest" | "oldest";

export type AuditLogCursor = {
  v: 1;
  createdAt: string;
  id: number;
  sort: AuditLogSort;
};

export type CreateAuditLogInput = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;

  actorId?: number | null;

  oldValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;

  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuditLogListFilters = {
  actorId?: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;

  from?: Date;
  to?: Date;

  limit: number;
  cursor?: AuditLogCursor;
};

export type AuditLogListItem = {
  id: number;

  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;

  oldValue: unknown;
  newValue: unknown;
  metadata: unknown;

  ipAddress: string | null;
  userAgent: string | null;

  actor: {
    id: number;
    fullName: string;
    role: string;
  } | null;

  createdAt: Date;
};

export type AuditLogListResult = {
  items: AuditLogListItem[];

  pagination: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
};