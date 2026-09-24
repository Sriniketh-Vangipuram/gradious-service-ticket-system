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
 */
centerRouter.get(
  "/",
  requireAuth,
  validateRequest({
    query: listCentersQuerySchema,
  }),
  listCentersController,
);

centerRouter.get(
  "/:centerId",
  requireAuth,
  validateRequest({
    params: centerIdParamSchema,
  }),
  getCenterController,
);

/**
 * Create center
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