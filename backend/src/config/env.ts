import "dotenv/config";

import {z} from "zod";

const envSchema=z.object({

    NODE_ENV:z
        .enum(["development","test","production"])
        .default("development"),

    PORT:z.coerce
        .number()
        .int()
        .positive()
        .default(5000),

    DATABASE_URL:z.string().min(1),

    JWT_ACCESS_SECRET:z.string().min(32),
    JWT_ACCESS_EXPIRES_IN:z.string().default("15m"),

    REFRESH_TOKEN_SECRET:z.string().min(32),
    REFRESH_TOKEN_EXPIRES_DAYS:z.coerce.number().int().positive().default(7),

    FRONTEND_URL:z.string().url(),
});

const parsedEnv=envSchema.safeParse(process.env);

if(!parsedEnv.success){
    console.error("Invalid environment configuration:");
    console.error(parsedEnv.error.flatten().fieldErrors);

    process.exit(1);
}

export const env = parsedEnv.data;