import { Router } from "express";

import {registerController, 
        loginController, 
        refreshController, 
        logoutController,
        meController } from "./auth.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

export const authRouter = Router();


authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/refresh", refreshController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", requireAuth, meController);
