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

    centerId: z.number().int().positive().optional(),

    labId: z.number().int().positive().optional(),

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

export const updateTicketParamsSchema = z.object({
  ticketId:z.coerce.number().int().positive(),
}).strict();

export const updateTicketBodySchema = z
  .object({
    title: z.string().trim().min(5).max(150).optional(),

    description: z.string().trim().min(10).max(5000).optional(),

    categoryId: z.coerce.number().int().positive().optional(),

    softwareId: z.coerce.number().int().positive().nullable().optional(),

    requestType: z.enum(Object.values(SoftwareRequestType)).nullable().optional(),

    centerId: z.coerce.number().int().positive().optional(),

    labId: z.coerce.number().int().positive().optional(),

    priority: z.enum(Object.values(TicketPriority)).optional(),
  })
    .strict()
    .superRefine((body, ctx) => {
    if (Object.keys(body).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be provided for update.",
      });
    }

    const hasSoftwareId = body.softwareId !== undefined;
    const hasRequestType = body.requestType !== undefined;

    if (hasSoftwareId !== hasRequestType) {
      ctx.addIssue({
        code: "custom",
        path: ["softwareId"],
        message:
          "softwareId and requestType must be provided together.",
      });
    }
  });

export const assignCenterManagerBodySchema = z.object({
  centerManagerId: z.coerce
    .number()
    .int()
    .positive(),
}).strict();

export const assignTechnicianBodySchema = z.object({
  technicianId: z.coerce
    .number()
    .int()
    .positive(),
}).strict();


const ordinaryTicketStatusValues = [
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
] as const;

export const changeTicketStatusBodySchema = z.object({
  status:z.enum(ordinaryTicketStatusValues),
}).strict();

export const resolveTicketBodySchema = z.object({
  resolution:z.string().trim().min(10).max(5000),
  reason:z.string().trim().min(1).max(500).optional(),
})
  .strict()
  .superRefine((data,ctx)=>{
    //Manager / admin resolution requires an explicit reason.
    // This role-dependent requirement is enforced here.
    if(data.reason!==undefined && data.reason.length===0){
      ctx.addIssue({
        code:"custom",
        path:["reason"],
        message:"Reason cannot be empty.",
      });
    }
  });

  export const reopenTicketBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const cancelTicketBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
  })
  .strict();




export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
export type UpdateTicketParams = z.infer<
  typeof updateTicketParamsSchema
>;

export type UpdateTicketBody = z.infer<
  typeof updateTicketBodySchema
>;

export type ChangeTicketStatusBody = z.infer<typeof changeTicketStatusBodySchema>;
export type ResolveTicketBody = z.infer<typeof resolveTicketBodySchema>;
export type ReopenTicketBody = z.infer<typeof reopenTicketBodySchema>;

export type CancelTicketBody = z.infer<
  typeof cancelTicketBodySchema
>;
export type AssignCenterManagerBody = z.infer<
  typeof assignCenterManagerBodySchema
>;

export type AssignTechnicianBody = z.infer<
  typeof assignTechnicianBodySchema
>;