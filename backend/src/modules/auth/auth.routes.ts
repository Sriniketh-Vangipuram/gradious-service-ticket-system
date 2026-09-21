import { Router } from "express";

import {registerController, 
        loginController, 
        refreshController, 
        logoutController,
        meController } from "./auth.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { loginSchema, registerSchema } from "./auth.schemas";
import {
  loginRateLimiter,
  registerRateLimiter,
  refreshRateLimiter,
} from "./auth.rate-limit";


export const authRouter = Router();


authRouter.post(
  "/register",
  registerRateLimiter,
  validateRequest({ body: registerSchema }),
  registerController,
);

authRouter.post(
  "/login",
  loginRateLimiter,
  validateRequest({ body: loginSchema }),
  loginController,
);

authRouter.post("/refresh",refreshRateLimiter, refreshController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", requireAuth, meController);
