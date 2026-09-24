import { z } from "zod";

import {
  SoftwareRequestType,
  TicketPriority,
  TicketStatus,
} from "../../generated/prisma/client";

/* ============================================================
 * ENUM VALUES
 * ============================================================ */

const ticketPriorityValues = Object.values(TicketPriority);

const softwareRequestTypeValues = Object.values(
  SoftwareRequestType,
);

const ticketStatusValues = Object.values(TicketStatus);

/* ============================================================
 * CREATE TICKET
 * ============================================================ */

export const createTicketSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters long.")
      .max(200, "Title cannot exceed 200 characters."),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters long.")
      .max(10000, "Description cannot exceed 10000 characters."),

    categoryId: z
      .number()
      .int()
      .positive(),

    softwareId: z
      .number()
      .int()
      .positive()
      .optional(),

    centerId: z
      .number()
      .int()
      .positive()
      .optional(),

    labId: z
      .number()
      .int()
      .positive()
      .optional(),

    priority: z.enum(ticketPriorityValues),

    requestType: z
      .enum(softwareRequestTypeValues)
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasSoftwareId =
      data.softwareId !== undefined;

    const hasRequestType =
      data.requestType !== undefined;

    /*
     * softwareId and requestType form one logical pair.
     */
    if (hasSoftwareId !== hasRequestType) {
      ctx.addIssue({
        code: "custom",
        path: ["softwareId"],
        message:
          "softwareId and requestType must be provided together.",
      });
    }
  });

/* ============================================================
 * TICKET ID PARAMS
 * ============================================================ */

export const ticketIdParamsSchema = z
  .object({
    ticketId: z.coerce
      .number()
      .int()
      .positive(
        "Ticket ID must be a positive integer.",
      ),
  })
  .strict();

/* ============================================================
 * LIST TICKETS
 * ============================================================ */

export const listTicketsQuerySchema = z
  .object({
    cursor: z
      .string()
      .min(1)
      .max(512)
      .optional(),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    status: z
      .enum(ticketStatusValues)
      .optional(),

    priority: z
      .enum(ticketPriorityValues)
      .optional(),

    categoryId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    centerId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    labId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    search: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .optional(),

    sort: z
      .enum(["newest", "oldest"])
      .default("newest"),
  })
  .strict();

/* ============================================================
 * UPDATE TICKET PARAMS
 * ============================================================ */

export const updateTicketParamsSchema = z
  .object({
    ticketId: z.coerce
      .number()
      .int()
      .positive(
        "Ticket ID must be a positive integer.",
      ),
  })
  .strict();

/* ============================================================
 * UPDATE TICKET
 * ============================================================
 *
 * Generic PATCH endpoint.
 *
 * Intentionally excludes:
 *
 * - centerId
 * - labId
 * - priority
 * - status
 * - assignments
 *
 * Those operations belong to dedicated workflows.
 * ============================================================ */

export const updateTicketBodySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters long.")
      .max(200, "Title cannot exceed 200 characters.")
      .optional(),

    description: z
      .string()
      .trim()
      .min(
        10,
        "Description must be at least 10 characters long.",
      )
      .max(
        10000,
        "Description cannot exceed 10000 characters.",
      )
      .optional(),

    categoryId: z.coerce
      .number()
      .int()
      .positive()
      .optional(),

    /*
     * null explicitly clears the software.
     */
    softwareId: z.coerce
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    /*
     * null explicitly clears the request type.
     */
    requestType: z
      .enum(softwareRequestTypeValues)
      .nullable()
      .optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    /*
     * PATCH {} is meaningless.
     */
    if (Object.keys(body).length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "At least one field must be provided for update.",
      });
    }

    /*
     * softwareId and requestType must be supplied
     * together when either one is being changed.
     *
     * Examples:
     *
     * {}                         -> valid at this stage
     * { softwareId: 10 }         -> invalid
     * { requestType: INSTALLATION } -> invalid
     * { softwareId: 10, requestType: INSTALLATION } -> valid
     *
     * null also counts as explicitly supplied:
     *
     * {
     *   softwareId: null,
     *   requestType: null
     * }
     *
     * This allows both values to be cleared together.
     */
    const hasSoftwareId =
      body.softwareId !== undefined;

    const hasRequestType =
      body.requestType !== undefined;

    if (hasSoftwareId !== hasRequestType) {
      ctx.addIssue({
        code: "custom",
        path: ["softwareId"],
        message:
          "softwareId and requestType must be provided together.",
      });
    }
  });

/* ============================================================
 * ASSIGN CENTER MANAGER
 * ============================================================ */

export const assignCenterManagerBodySchema = z
  .object({
    centerManagerId: z.coerce
      .number()
      .int()
      .positive(),
  })
  .strict();

/* ============================================================
 * ASSIGN TECHNICIAN
 * ============================================================ */

export const assignTechnicianBodySchema = z
  .object({
    technicianId: z.coerce
      .number()
      .int()
      .positive(),
  })
  .strict();

/* ============================================================
 * ORDINARY STATUS CHANGE
 * ============================================================ */

const ordinaryTicketStatusValues = [
  "IN_PROGRESS",
  "WAITING_FOR_USER",
] as const;

export const changeTicketStatusBodySchema = z
  .object({
    status: z.enum(
      ordinaryTicketStatusValues,
    ),
  })
  .strict();

/* ============================================================
 * RESOLVE TICKET
 * ============================================================ */

export const resolveTicketBodySchema = z
  .object({
    resolution: z
      .string()
      .trim()
      .min(
        10,
        "Resolution must be at least 10 characters long.",
      )
      .max(
        5000,
        "Resolution cannot exceed 5000 characters.",
      ),

    reason: z
      .string()
      .trim()
      .min(1, "Reason cannot be empty.")
      .max(
        500,
        "Reason cannot exceed 500 characters.",
      )
      .optional(),
  })
  .strict();

/*
 * Whether reason is REQUIRED depends on the actor role,
 * so that authorization/domain rule belongs in the resolve
 * use case rather than this generic request schema.
 */

/* ============================================================
 * REOPEN TICKET
 * ============================================================ */

export const reopenTicketBodySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Reason cannot be empty.")
      .max(
        500,
        "Reason cannot exceed 500 characters.",
      ),
  })
  .strict();

/* ============================================================
 * CANCEL TICKET
 * ============================================================ */

export const cancelTicketBodySchema = z
  .object({
    reason: z
      .string()
      .trim()
      .min(1, "Reason cannot be empty.")
      .max(
        500,
        "Reason cannot exceed 500 characters.",
      ),
  })
  .strict();

/* ============================================================
 * TYPES
 * ============================================================ */

export type CreateTicketInput = z.infer<
  typeof createTicketSchema
>;

export type TicketIdParams = z.infer<
  typeof ticketIdParamsSchema
>;

export type ListTicketsQuery = z.infer<
  typeof listTicketsQuerySchema
>;

export type UpdateTicketParams = z.infer<
  typeof updateTicketParamsSchema
>;

export type UpdateTicketBody = z.infer<
  typeof updateTicketBodySchema
>;

export type ChangeTicketStatusBody = z.infer<
  typeof changeTicketStatusBodySchema
>;

export type ResolveTicketBody = z.infer<
  typeof resolveTicketBodySchema
>;

export type ReopenTicketBody = z.infer<
  typeof reopenTicketBodySchema
>;

export type CancelTicketBody = z.infer<
  typeof cancelTicketBodySchema
>;

export type AssignCenterManagerBody = z.infer<
  typeof assignCenterManagerBodySchema
>;

export type AssignTechnicianBody = z.infer<
  typeof assignTechnicianBodySchema
>;