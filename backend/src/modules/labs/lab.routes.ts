import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";

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
  validateRequest({
    query: listLabsQuerySchema,
  }),
  listLabsController,
);

labRouter.get(
  "/:labId",
  requireAuth,
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
  requireRole("ADMIN"),
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
  requireRole("ADMIN"),
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
  requireRole("ADMIN"),
  validateRequest({
    params: labIdParamSchema,
    body: updateLabStatusBodySchema,
  }),
  updateLabStatusController,
);

export default labRouter;