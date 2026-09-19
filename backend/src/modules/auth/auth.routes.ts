import { Router } from "express";

import {registerController, 
        loginController, 
        refreshController, 
        logoutController,
        meController } from "./auth.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { loginSchema, registerSchema } from "./auth.schemas";

export const authRouter = Router();


authRouter.post(
  "/register",
  validateRequest({ body: registerSchema }),
  registerController,
);

authRouter.post(
  "/login",
  validateRequest({ body: loginSchema }),
  loginController,
);

authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", requireAuth, meController);
