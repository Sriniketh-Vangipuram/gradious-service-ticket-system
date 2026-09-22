import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),

    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(128, "Password must be less than 128 characters"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type RegisterFormValues =
  z.infer<typeof registerSchema>;