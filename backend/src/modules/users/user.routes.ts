import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { UserRole } from "../../generated/prisma/client";

import { listUsersQuerySchema,updateUserSpecializationsBodySchema, userIdParamsSchema } from "./user.schemas";
import { listUsersController,updateUserSpecializationsController } from "./user.controller";

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


userRouter.put(
  "/:userId/specializations",
  requireAuth,
  requireRole(
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ),
  validateRequest({
    params: userIdParamsSchema,
    body: updateUserSpecializationsBodySchema,
  }),
  updateUserSpecializationsController,
);


export default userRouter;