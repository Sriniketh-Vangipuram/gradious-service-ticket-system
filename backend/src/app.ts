import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";


import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./routes/health.routes";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(pinoHttp());

app.use("/api/v1/health", healthRouter);
app.use("/api/v1/auth",authRouter);