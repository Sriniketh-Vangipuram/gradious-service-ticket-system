import { createServer } from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";

const server = createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log("Database connected");

    server.listen(env.PORT, () => {
      console.log(
        `API server running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    await prisma.$disconnect();

    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    await prisma.$disconnect();

    console.log("HTTP server closed");
    console.log("Database connection closed");

    process.exit(0);
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startServer();