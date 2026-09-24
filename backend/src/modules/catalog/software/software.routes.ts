import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { validateRequest } from "../../../common/validation/validate-request";

import {
  softwareIdParamSchema,
  listSoftwareQuerySchema,
  createSoftwareBodySchema,
  updateSoftwareBodySchema,
  updateSoftwareStatusBodySchema,
} from "./software.schemas";

import {
  listSoftwareController,
  getSoftwareController,
  createSoftwareController,
  updateSoftwareController,
  updateSoftwareStatusController,
} from "./software.controller";

const softwareRouter = Router();

/**
 * Read software catalog
 */
softwareRouter.get(
  "/",
  requireAuth,
  validateRequest({
    query: listSoftwareQuerySchema,
  }),
  listSoftwareController,
);

softwareRouter.get(
  "/:softwareId",
  requireAuth,
  validateRequest({
    params: softwareIdParamSchema,
  }),
  getSoftwareController,
);

/**
 * Create software
 */
softwareRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    body: createSoftwareBodySchema,
  }),
  createSoftwareController,
);

/**
 * Update software metadata
 */
softwareRouter.patch(
  "/:softwareId",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: softwareIdParamSchema,
    body: updateSoftwareBodySchema,
  }),
  updateSoftwareController,
);

/**
 * Activate / deactivate software
 */
softwareRouter.patch(
  "/:softwareId/status",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: softwareIdParamSchema,
    body: updateSoftwareStatusBodySchema,
  }),
  updateSoftwareStatusController,
);

export default softwareRouter;