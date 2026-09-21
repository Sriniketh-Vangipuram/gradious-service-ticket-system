import { Router } from "express";
import { prisma } from "../config/database";

export const healthRouter = Router();

// Liveness: confirms the API process is responding.
healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      service: "gradious-service-ticket-api",
    },
  });
});

// Readiness: confirms the API can reach the database.
healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      data: {
        status: "ready",
        service: "gradious-service-ticket-api",
        dependencies: {
          database: "connected",
        },
      },
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Service is not ready",
      },
    });
  }
});