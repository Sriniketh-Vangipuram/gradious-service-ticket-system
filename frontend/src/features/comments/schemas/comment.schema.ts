import { z } from "zod";

export const createTicketCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(5000, "Comment must not exceed 5,000 characters."),
});

export type CreateTicketCommentFormValues = z.infer<
  typeof createTicketCommentSchema
>;