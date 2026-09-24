import { z } from "zod";

export const categoryIdParamSchema = z
  .object({
    categoryId: z.coerce.number().int().positive(),
  })
  .strict();

export const listCategoriesQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1)
      .max(100)
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

export const createCategoryBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100),

    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((value) => value.toUpperCase()),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),
  })
  .strict();

export const updateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    code: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((value) => value.toUpperCase())
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.name !== undefined ||
      body.code !== undefined ||
      body.description !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export const updateCategoryStatusBodySchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type CategoryIdParams = z.infer<
  typeof categoryIdParamSchema
>;

export type ListCategoriesQuery = z.infer<
  typeof listCategoriesQuerySchema
>;

export type CreateCategoryBody = z.infer<
  typeof createCategoryBodySchema
>;

export type UpdateCategoryBody = z.infer<
  typeof updateCategoryBodySchema
>;

export type UpdateCategoryStatusBody = z.infer<
  typeof updateCategoryStatusBodySchema
>;