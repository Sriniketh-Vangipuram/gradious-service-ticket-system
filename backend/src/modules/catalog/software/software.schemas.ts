import { z } from "zod";

export const softwareIdParamSchema = z
  .object({
    softwareId: z.coerce.number().int().positive(),
  })
  .strict();

export const listSoftwareQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(150).optional(),

    vendor: z.string().trim().min(1).max(120).optional(),

    isActive: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    licenseRequired: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),

    page: z.coerce.number().int().positive().default(1),

    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),
  })
  .strict();

export const createSoftwareBodySchema = z
  .object({
    name: z.string().trim().min(2).max(150),

    vendor: z
      .string()
      .trim()
      .max(120)
      .nullable()
      .optional(),

    version: z
      .string()
      .trim()
      .max(60)
      .nullable()
      .optional(),

    licenseRequired: z.boolean().default(false),
  })
  .strict();

export const updateSoftwareBodySchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),

    vendor: z
      .string()
      .trim()
      .max(120)
      .nullable()
      .optional(),

    version: z
      .string()
      .trim()
      .max(60)
      .nullable()
      .optional(),

    licenseRequired: z.boolean().optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.name !== undefined ||
      body.vendor !== undefined ||
      body.version !== undefined ||
      body.licenseRequired !== undefined,
    {
      message: "At least one field must be provided.",
    },
  );

export const updateSoftwareStatusBodySchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type SoftwareIdParams = z.infer<
  typeof softwareIdParamSchema
>;

export type ListSoftwareQuery = z.infer<
  typeof listSoftwareQuerySchema
>;

export type CreateSoftwareBody = z.infer<
  typeof createSoftwareBodySchema
>;

export type UpdateSoftwareBody = z.infer<
  typeof updateSoftwareBodySchema
>;

export type UpdateSoftwareStatusBody = z.infer<
  typeof updateSoftwareStatusBodySchema
>;