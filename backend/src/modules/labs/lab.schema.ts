import { z } from "zod";

export const labIdParamSchema = z
  .object({
    labId: z.coerce.number().int().positive(),
  })
  .strict();

export const listLabsQuerySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),

    search: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    page: z.coerce.number().int().positive().default(1),

    limit: z
      .coerce.number()
      .int()
      .positive()
      .max(100)
      .default(20),
  })
  .strict();

export const createLabBodySchema = z
  .object({
    centerId: z.coerce.number().int().positive(),

    name: z
      .string()
      .trim()
      .min(2)
      .max(120),

    code: z
      .string()
      .trim()
      .min(2)
      .max(30)
      .transform((value) => value.toUpperCase()),
  })
  .strict();

export const updateLabBodySchema = z
  .object({
    centerId: z.coerce.number().int().positive().optional(),

    name: z
      .string()
      .trim()
      .min(2)
      .max(120)
      .optional(),

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
    (body) =>
      body.centerId !== undefined ||
      body.name !== undefined ||
      body.code !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export const updateLabStatusBodySchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type LabIdParams = z.infer<typeof labIdParamSchema>;

export type ListLabsQuery = z.infer<
  typeof listLabsQuerySchema
>;

export type CreateLabBody = z.infer<
  typeof createLabBodySchema
>;

export type UpdateLabBody = z.infer<
  typeof updateLabBodySchema
>;

export type UpdateLabStatusBody = z.infer<
  typeof updateLabStatusBodySchema
>;