import {z} from "zod";

export const loginSchema=z.object({
    email:z 
        .string()
        .trim()
        .email()
        .max(254)
        .transform((email)=>email.toLowerCase()),

    password:z
        .string()
        .min(12)
        .max(128)
});

export const registerSchema=z.object({
    fullName:z
        .string()
        .trim()
        .min(2)
        .max(120),

    email:z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((email)=>email.toLowerCase()),

    password: z
        .string()
        .min(12)
        .max(128)
}).strict();

export type LoginInput=z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;