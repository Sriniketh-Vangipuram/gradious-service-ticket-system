import { z } from "zod";

const ticketPriorityValues = ["LOW", "MEDIUM", "HIGH"] as const;

const softwareRequestTypeValues = [
  "INSTALLATION",
  "UPDATE",
  "UNINSTALLATION",
  "LICENSE",
] as const;

export const createTicketSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters.")
      .max(200, "Title must not exceed 200 characters."),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(10000, "Description must not exceed 10,000 characters."),

    categoryId: z
      .number()
      .int()
      .positive("Please select a category."),

    softwareId: z
      .number()
      .int()
      .positive()
      .optional(),

    priority: z.enum(ticketPriorityValues),

    requestType: z.enum(softwareRequestTypeValues).optional(),
  })
  .superRefine((data, ctx) => {
    const hasSoftwareId = data.softwareId !== undefined;
    const hasRequestType = data.requestType !== undefined;

    if (hasSoftwareId !== hasRequestType) {
      ctx.addIssue({
        code: "custom",
        path: ["softwareId"],
        message: "Software and request type must be selected together.",
      });
    }
  });

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;