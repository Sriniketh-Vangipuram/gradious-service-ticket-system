import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";


import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./routes/health.routes";
import { errorMiddleware } from "./common/errors/error.middleware";
import ticketRouter from "./modules/tickets/ticket.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import catalogRouter from "./modules/catalog/catalog.routes";
import userRouter from "./modules/users/user.routes";
import centerRouter from "./modules/centers/center.routes";
import labRouter from "./modules/labs/lab.routes";
import categoryRouter from "./modules/catalog/categories/category.routes";
import { env } from "./config/env";
import crypto from "node:crypto";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(
  pinoHttp({
    genReqId: (req, res) => {
      const requestId = crypto.randomUUID();

      res.setHeader("X-Request-Id", requestId);

      return requestId;
    },
  }),
);

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth",authRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/catalog", catalogRouter);
app.use("/api/v1/users",userRouter);
app.use("/api/v1/centers",centerRouter);
app.use("/api/v1/labs",labRouter);
app.use("/api/v1/categories",categoryRouter);
// Must be registered after routes.
app.use(errorMiddleware);