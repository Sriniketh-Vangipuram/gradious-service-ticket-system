import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { env } from "./env";

const databaseUrl = new URL(env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port) || 3306,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  connectionLimit:3,
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "event",
      level: "error",
    },
  ],
});

prisma.$on("query", (event) => {
  console.log("[Prisma Query]", {
    query: event.query,
    params: event.params,
    duration: event.duration,
  });
});

prisma.$on("error", (event) => {
  console.error("[Prisma Error]", event);
});