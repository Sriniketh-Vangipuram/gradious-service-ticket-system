import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  centerIdParamSchema,
  createCenterBodySchema,
  listCentersQuerySchema,
  updateCenterBodySchema,
  updateCenterStatusBodySchema,
} from "./center.schema";

import {
  listCentersController,
  getCenterController,
  createCenterController,
  updateCenterController,
  updateCenterStatusController,
} from "./center.controller";

const centerRouter = Router();

/**
 * Read centers
 *
 * ADMIN:
 *   Can view all centers.
 *
 * CENTER_MANAGER:
 *   Can only view centers assigned through UserCenter.
 */
centerRouter.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "CENTER_MANAGER"),
  validateRequest({
    query: listCentersQuerySchema,
  }),
  listCentersController,
);

centerRouter.get(
  "/:centerId",
  requireAuth,
  requireRole("ADMIN", "CENTER_MANAGER"),
  validateRequest({
    params: centerIdParamSchema,
  }),
  getCenterController,
);

/**
 * Create center
 *
 * ADMIN only.
 */
centerRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    body: createCenterBodySchema,
  }),
  createCenterController,
);

/**
 * Update center
 *
 * ADMIN only.
 */
centerRouter.patch(
  "/:centerId",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: centerIdParamSchema,
    body: updateCenterBodySchema,
  }),
  updateCenterController,
);

/**
 * Activate / deactivate center
 *
 * ADMIN only.
 */
centerRouter.patch(
  "/:centerId/status",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: centerIdParamSchema,
    body: updateCenterStatusBodySchema,
  }),
  updateCenterStatusController,
);

export default centerRouter;