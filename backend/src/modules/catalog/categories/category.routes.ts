import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";
import { validateRequest } from "../../../common/validation/validate-request";

import {
  categoryIdParamSchema,
  listCategoriesQuerySchema,
  createCategoryBodySchema,
  updateCategoryBodySchema,
  updateCategoryStatusBodySchema,
} from "./category.schema";

import {
  listCategoriesController,
  getCategoryController,
  createCategoryController,
  updateCategoryController,
  updateCategoryStatusController,
} from "./category.controller";

const categoryRouter = Router();

/**
 * Read categories
 */
categoryRouter.get(
  "/",
  requireAuth,
  validateRequest({
    query: listCategoriesQuerySchema,
  }),
  listCategoriesController,
);

categoryRouter.get(
  "/:categoryId",
  requireAuth,
  validateRequest({
    params: categoryIdParamSchema,
  }),
  getCategoryController,
);

/**
 * Create category
 */
categoryRouter.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    body: createCategoryBodySchema,
  }),
  createCategoryController,
);

/**
 * Update category
 */
categoryRouter.patch(
  "/:categoryId",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: categoryIdParamSchema,
    body: updateCategoryBodySchema,
  }),
  updateCategoryController,
);

/**
 * Activate / deactivate category
 */
categoryRouter.patch(
  "/:categoryId/status",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: categoryIdParamSchema,
    body: updateCategoryStatusBodySchema,
  }),
  updateCategoryStatusController,
);

export default categoryRouter;