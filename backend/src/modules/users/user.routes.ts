import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { UserRole } from "../../generated/prisma/client";

import { 
  listUsersQuerySchema,
  updateUserSpecializationsBodySchema, 
  userIdParamsSchema,
  updateUserStatusBodySchema,
  updateUserCenterAccessBodySchema,
  updateUserProfileBodySchema,
} from "./user.schemas";

import { 
  listUsersController,
  getUserController,
  updateUserSpecializationsController,
  updateUserStatusController,
  updateUserCenterAccessController,
  updateUserProfileController,
} from "./user.controller";

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

userRouter.get(
  "/:userId",
  requireAuth,
  requireRole(UserRole.CENTER_MANAGER, UserRole.ADMIN),
  validateRequest({
    params: userIdParamsSchema,
  }),
  getUserController,
);

userRouter.patch(
  "/:userId",
  requireAuth,
  requireRole(
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ),
  validateRequest({
    params: userIdParamsSchema,
    body: updateUserProfileBodySchema,
  }),
  updateUserProfileController,
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

userRouter.patch(
  "/:userId/status",
  requireAuth,
  requireRole(
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ),
  validateRequest({
    params: userIdParamsSchema,
    body: updateUserStatusBodySchema,
  }),
  updateUserStatusController,
);

userRouter.patch(
  "/:userId/center-access",
  requireAuth,
  requireRole(
    UserRole.CENTER_MANAGER,
    UserRole.ADMIN,
  ),
  validateRequest({
    params: userIdParamsSchema,
    body: updateUserCenterAccessBodySchema,
  }),
  updateUserCenterAccessController,
);

export default userRouter;