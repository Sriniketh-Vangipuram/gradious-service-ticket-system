import { z } from "zod";

export const ticketCommentParamsSchema = z
  .object({
    ticketId: z.coerce.number().int().positive(),
  })
  .strict();

export const createTicketCommentBodySchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
    visibility: z.enum(["PUBLIC", "INTERNAL"]).default("PUBLIC"),
  })
  .strict();

export type CreateTicketCommentBody = z.infer<
  typeof createTicketCommentBodySchema
>;