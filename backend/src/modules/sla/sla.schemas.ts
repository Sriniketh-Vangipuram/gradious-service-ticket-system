import { z } from "zod";

import {
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/client";

/**
 * SLA state exposed by the monitoring API.
 *
 * These are derived read-model states.
 * They are NOT stored in the database.
 */
export const slaMonitoringStatusSchema = z.enum([
  "PENDING",
  "AT_RISK",
  "OVERDUE",
  "PAUSED",
  "MET",
  "BREACHED",
  "CANCELLED",
]);

export type SlaMonitoringStatus = z.infer<
  typeof slaMonitoringStatusSchema
>;

/**
 * Query parameters for GET /api/v1/sla/tickets
 */
export const listSlaTicketsQuerySchema = z
  .object({
    priority: z
      .enum(TicketPriority)
      .optional(),

    ticketStatus: z
      .enum(TicketStatus)
      .optional(),

    centerId: z
      .coerce
      .number()
      .int("Center ID must be an integer.")
      .positive("Center ID must be greater than zero.")
      .optional(),

    categoryId: z
      .coerce
      .number()
      .int("Category ID must be an integer.")
      .positive("Category ID must be greater than zero.")
      .optional(),

    assigneeId: z
      .coerce
      .number()
      .int("Assignee ID must be an integer.")
      .positive("Assignee ID must be greater than zero.")
      .optional(),

    firstResponseStatus: slaMonitoringStatusSchema.optional(),

    resolutionStatus: slaMonitoringStatusSchema.optional(),

    paused: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    limit: z
      .coerce
      .number()
      .int("Limit must be an integer.")
      .min(1)
      .max(50)
      .default(20),

    cursor: z
      .coerce
      .number()
      .int("Cursor must be an integer.")
      .positive("Cursor must be greater than zero.")
      .optional(),
  })
  .strict();

export type ListSlaTicketsQuery = z.infer<
  typeof listSlaTicketsQuerySchema
>;

export const slaOverviewQuerySchema = z
  .object({
    centerId: z.coerce
      .number()
      .int("Center ID must be an integer.")
      .positive(
        "Center ID must be greater than zero.",
      )
      .optional(),
  })
  .strict();

export type SlaOverviewQuery = z.infer<
  typeof slaOverviewQuerySchema
>;