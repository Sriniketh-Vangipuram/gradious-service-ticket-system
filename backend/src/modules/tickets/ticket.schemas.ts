import { z } from "zod";
import {
  TicketPriority,
  SoftwareRequestType,
} from "../../generated/prisma/client";

const ticketPriorityValues = Object.values(TicketPriority);
const softwareRequestTypeValues = Object.values(SoftwareRequestType);

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



export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;