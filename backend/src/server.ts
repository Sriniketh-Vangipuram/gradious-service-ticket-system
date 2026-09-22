import { createServer } from "node:http";

import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/database";
import { startSlaAlertScheduler } from "./modules/notifications/sla-alert.scheduler";
import { initializeSocketServer } from "./socket/socket.server";

const server = createServer(app);

const io = initializeSocketServer(server);

let isShuttingDown = false;

let stopSlaAlertScheduler: (() => Promise<void>) | undefined;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log("Database connected");

    stopSlaAlertScheduler = startSlaAlertScheduler();

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
  if (isShuttingDown) {
    console.log(`[Server] Shutdown already in progress; ignoring ${signal}.`);
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(async (error) => {
  try {
    if (error) {
      console.error("[Server] Error while closing HTTP server:", error);
      process.exitCode = 1;
    }

    await stopSlaAlertScheduler?.();

    await prisma.$disconnect();
    console.log("[Server] Database connection closed.");
  } catch (shutdownError) {
    console.error("[Server] Error during shutdown:", shutdownError);
    process.exitCode = 1;
  } finally {
    console.log("[Server] Shutdown complete.");
  }
});
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void startServer();