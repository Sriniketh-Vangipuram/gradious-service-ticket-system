import { z } from "zod";

import { TicketPriority } from "../../../generated/prisma/client";

/**
 * Create/update SLA policy payload.
 *
 * Business rules:
 * - firstResponseMinutes must be at least 1 minute.
 * - resolutionMinutes must be at least 1 minute.
 * - atRiskThresholdPercent must be between 0 and 100.
 */
export const upsertSlaPolicySchema = z
  .object({
    firstResponseMinutes: z
      .number()
      .int("First response time must be an integer.")
      .min(
        1,
        "First response time must be at least 1 minute.",
      ),

    resolutionMinutes: z
      .number()
      .int("Resolution time must be an integer.")
      .min(
        1,
        "Resolution time must be at least 1 minute.",
      ),

    atRiskThresholdPercent: z
      .number()
      .int("At-risk threshold must be an integer.")
      .min(
        0,
        "At-risk threshold cannot be less than 0.",
      )
      .max(
        100,
        "At-risk threshold cannot exceed 100.",
      ),
  })
  .strict();

export type UpsertSlaPolicyInput = z.infer<
  typeof upsertSlaPolicySchema
>;

/**
 * Priority path parameter.
 *
 * Example:
 * /api/v1/sla/policies/HIGH
 */
export const slaPolicyPriorityParamsSchema = z
  .object({
    priority: z.enum(TicketPriority),
  })
  .strict();

export type SlaPolicyPriorityParams = z.infer<
  typeof slaPolicyPriorityParamsSchema
>;

/**
 * Activate/deactivate policy.
 */
export const updateSlaPolicyStatusSchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type UpdateSlaPolicyStatusInput = z.infer<
  typeof updateSlaPolicyStatusSchema
>;