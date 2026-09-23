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

  role: z.nativeEnum(UserRole).optional(),

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
    .nativeEnum(TechnicianSpecialization)
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