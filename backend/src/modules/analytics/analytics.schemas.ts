import { z } from "zod";

import { TicketPriority } from "../../generated/prisma/enums";

const dateSchema = z.coerce.date();

const positiveIntSchema = z.coerce
  .number()
  .int()
  .positive();

export const analyticsFilterSchema = z
  .object({
    from: dateSchema,
    to: dateSchema,
    centerId: positiveIntSchema.optional(),
    categoryId: positiveIntSchema.optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
  })
  .refine(
    (data) => data.from <= data.to,
    {
      path: ["to"],
      message: "The 'to' date must be greater than or equal to the 'from' date",
    },
  );

  
export const ticketTrendSchema = analyticsFilterSchema.extend({
  granularity: z
    .enum(["day", "week", "month"])
    .default("day"),
});

export const analyticsIdSchema = z.object({
  id: positiveIntSchema,
});

export type AnalyticsFilterInput = z.infer<
  typeof analyticsFilterSchema
>;

export type TicketTrendInput = z.infer<
  typeof ticketTrendSchema
>;