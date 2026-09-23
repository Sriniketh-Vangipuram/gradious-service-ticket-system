import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import {
  getCategoriesController,
  getSoftwareController,
} from "./catalog.controller";

const router = Router();

router.get(
  "/categories",
  requireAuth,
  getCategoriesController,
);

router.get(
  "/software",
  requireAuth,
  getSoftwareController,
);

export default router;