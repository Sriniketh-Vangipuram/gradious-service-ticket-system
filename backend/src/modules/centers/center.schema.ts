import { z } from "zod";

export const centerIdParamSchema = z
  .object({
    centerId: z.coerce.number().int().positive(),
  })
  .strict();

export const listCentersQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(120).optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict();

export const createCenterBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .transform((value) => value.toUpperCase()),
  })
  .strict();

export const updateCenterBodySchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .strict()
  .refine(
    (body) => body.name !== undefined || body.code !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export const updateCenterStatusBodySchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type ListCentersQuery = z.infer<typeof listCentersQuerySchema>;
export type CreateCenterBody = z.infer<typeof createCenterBodySchema>;
export type UpdateCenterBody = z.infer<typeof updateCenterBodySchema>;
export type UpdateCenterStatusBody = z.infer<
  typeof updateCenterStatusBodySchema
>;