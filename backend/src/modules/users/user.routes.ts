import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { UserRole } from "../../generated/prisma/client";

import { listUsersQuerySchema } from "./user.schemas";
import { listUsersController } from "./user.controller";

const userRouter = Router();

userRouter.get(
  "/",
  requireAuth,
  requireRole(
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ),
  validateRequest({
    query: listUsersQuerySchema,
  }),
  listUsersController,
);

export default userRouter;