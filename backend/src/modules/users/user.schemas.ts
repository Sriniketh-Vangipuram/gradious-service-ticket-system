import { z } from "zod";
import {
  TechnicianSpecialization,
  UserRole,
} from "../../generated/prisma/client";

export const listUsersQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, "Search must not be empty.")
    .max(100, "Search must be at most 100 characters.")
    .optional(),

  role: z.enum(UserRole).optional(),

  centerId: z.coerce
    .number()
    .int("Center ID must be an integer.")
    .positive("Center ID must be greater than zero.")
    .optional(),

  labId: z.coerce
    .number()
    .int("Lab ID must be an integer.")
    .positive("Lab ID must be greater than zero.")
    .optional(),

  specialization: z
    .enum(TechnicianSpecialization)
    .optional(),

  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),

  cursor: z.coerce
    .number()
    .int("Cursor must be an integer.")
    .positive("Cursor must be greater than zero.")
    .optional(),

  limit: z.coerce
    .number()
    .int("Limit must be an integer.")
    .min(1, "Limit must be at least 1.")
    .max(50, "Limit cannot exceed 50.")
    .default(20),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userIdParamsSchema = z.object({
  userId: z.coerce
    .number()
    .int("User ID must be an integer.")
    .positive("User ID must be greater than zero."),
});

export const updateUserSpecializationsBodySchema = z.object({
  specializations: z
    .array(z.nativeEnum(TechnicianSpecialization))
    .max(3, "A technician can have at most 3 specializations.")
    .refine(
      (values) => new Set(values).size === values.length,
      "Duplicate specializations are not allowed.",
    ),
});


export const updateUserStatusBodySchema = z
  .object({
    isActive: z.boolean(),
  })
  .strict();

export type UpdateUserStatusBody = z.infer<
  typeof updateUserStatusBodySchema
>;


export const updateUserRoleBodySchema = z
  .object({
    role: z.enum(UserRole),
  })
  .strict();

export type UpdateUserRoleBody = z.infer<
  typeof updateUserRoleBodySchema
>;

export const updateUserCenterAccessBodySchema = z
  .object({
    centerIds: z
      .array(
        z
          .coerce
          .number()
          .int("Center ID must be an integer.")
          .positive("Center ID must be greater than zero."),
      )
      .refine(
        (values) => new Set(values).size === values.length,
        "Duplicate center IDs are not allowed.",
      ),
  })
  .strict();

export type UpdateUserCenterAccessBody = z.infer<
  typeof updateUserCenterAccessBodySchema
>;

export const updateUserProfileBodySchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(120, "Full name must be at most 120 characters.")
      .optional(),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address.")
      .max(255, "Email must be at most 255 characters.")
      .transform((value) => value.toLowerCase())
      .optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.fullName !== undefined ||
      body.email !== undefined,
    {
      message: "At least one profile field must be provided.",
    },
  );

export type UpdateUserProfileBody = z.infer<
  typeof updateUserProfileBodySchema
>;

export const createUserBodySchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(120, "Full name must be at most 120 characters."),

    email: z
      .string()
      .trim()
      .email("Please provide a valid email address.")
      .max(255, "Email must be at most 255 characters.")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters."),

    role: z.enum(UserRole),

    primaryCenterId: z
      .coerce
      .number()
      .int("Primary center ID must be an integer.")
      .positive("Primary center ID must be greater than zero.")
      .optional(),
  })
  .strict();

export type CreateUserBody = z.infer<
  typeof createUserBodySchema
>;

export const updateUserPrimaryCenterBodySchema =
  z
    .object({
      centerId: z
        .coerce
        .number()
        .int("Center ID must be an integer.")
        .positive(
          "Center ID must be greater than zero.",
        ),
    })
    .strict();

export type UpdateUserPrimaryCenterBody =
  z.infer<
    typeof updateUserPrimaryCenterBodySchema
  >;