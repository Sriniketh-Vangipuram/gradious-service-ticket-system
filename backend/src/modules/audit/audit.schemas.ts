import { z } from "zod";
import { AuditAction } from "../../generated/prisma/enums";

export const AUDIT_ENTITY_TYPES = [
  "USER",
  "CENTER",
  "LAB",
  "CATEGORY",
  "SOFTWARE",
  "TICKET",
  "SLA_POLICY",
  "AUTHENTICATION",
] as const;

const AUDIT_ACTIONS = Object.values(
  AuditAction,
) as [AuditAction, ...AuditAction[]];

export const auditLogIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const auditLogListQuerySchema = z.object({
  actorId: z.coerce.number().int().positive().optional(),

  action: z
    .enum(AUDIT_ACTIONS)
    .optional(),

  entityType: z
    .enum(AUDIT_ENTITY_TYPES)
    .optional(),

  entityId: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  from: z.coerce.date().optional(),

  to: z.coerce.date().optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25),

  cursor: z
    .string()
    .min(1)
    .max(512)
    .optional(),

  sort: z
    .enum(["newest", "oldest"])
    .default("newest"),
});