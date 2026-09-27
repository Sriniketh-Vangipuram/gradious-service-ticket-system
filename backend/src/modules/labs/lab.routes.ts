import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";
import { UserRole } from "../../generated/prisma/client";

import {
  labIdParamSchema,
  listLabsQuerySchema,
  createLabBodySchema,
  updateLabBodySchema,
  updateLabStatusBodySchema,
} from "./lab.schema";

import {
  listLabsController,
  getLabController,
  createLabController,
  updateLabController,
  updateLabStatusController,
} from "./lab.controller";

const labRouter = Router();

/**
 * Read labs
 */
labRouter.get(
  "/",
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.CENTER_MANAGER,
  ),
  validateRequest({
    query: listLabsQuerySchema,
  }),
  listLabsController,
);

labRouter.get(
  "/:labId",
  requireAuth,
  requireRole(
    UserRole.ADMIN,
    UserRole.CENTER_MANAGER,
  ),
  validateRequest({
    params: labIdParamSchema,
  }),
  getLabController,
);

/**
 * Create lab
 */
labRouter.post(
  "/",
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateRequest({
    body: createLabBodySchema,
  }),
  createLabController,
);

/**
 * Update lab
 */
labRouter.patch(
  "/:labId",
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: labIdParamSchema,
    body: updateLabBodySchema,
  }),
  updateLabController,
);

/**
 * Activate / deactivate lab
 */
labRouter.patch(
  "/:labId/status",
  requireAuth,
  requireRole(UserRole.ADMIN),
  validateRequest({
    params: labIdParamSchema,
    body: updateLabStatusBodySchema,
  }),
  updateLabStatusController,
);

export default labRouter;