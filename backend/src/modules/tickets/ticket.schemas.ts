import { z } from "zod";
import {
  TicketPriority,
  SoftwareRequestType,
} from "../../generated/prisma/client";
import { TicketStatus } from "../../generated/prisma/client";


const ticketPriorityValues = Object.values(TicketPriority);
const softwareRequestTypeValues = Object.values(SoftwareRequestType);
const ticketStatusValues = Object.values(TicketStatus);


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

    categoryId: z.number().int().positive(),

    softwareId: z.number().int().positive().optional(),

    centerId: z.number().int().positive(),

    labId: z.number().int().positive(),

    priority: z.enum(ticketPriorityValues),

    requestType: z.enum(softwareRequestTypeValues).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasSoftwareId = data.softwareId !== undefined;
    const hasRequestType = data.requestType !== undefined;

    if (hasSoftwareId !== hasRequestType) {
      ctx.addIssue({
        code: "custom",
        path: ["softwareId"],
        message:
          "softwareId and requestType must be provided together.",
      });
    }
  });


export const ticketIdParamsSchema = z.object({
  ticketId:z.coerce
    .number()
    .int()
    .positive("Ticket ID must be a positive integer."),
}).strict();


export const listTicketsQuerySchema = z.object({
      cursor: z
        .string()
        .min(1)
        .max(512)
        .optional(),

      limit:z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),

      status:z
        .enum(ticketStatusValues)
        .optional(),
        
      priority:z
        .enum(ticketPriorityValues)
        .optional(),

      categoryId:z
        .coerce
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
        .enum(["newest","oldest"]).default("newest"),

}).strict();



export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;