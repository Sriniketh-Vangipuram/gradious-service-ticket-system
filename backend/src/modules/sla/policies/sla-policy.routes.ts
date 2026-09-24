import { Router } from "express";

import { requireAuth } from "../../../middleware/auth.middleware";
import { requireRole } from "../../../middleware/role.middleware";

import { validateRequest } from "../../../common/validation/validate-request";

import {
  slaPolicyPriorityParamsSchema,
  updateSlaPolicyStatusSchema,
  upsertSlaPolicySchema,
} from "./sla-policy.schemas";

import {
  getSlaPolicyController,
  listSlaPoliciesController,
  updateSlaPolicyStatusController,
  upsertSlaPolicyController,
} from "./sla-policy.controller";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get(
  "/",
  listSlaPoliciesController,
);

router.get(
  "/:priority",
  validateRequest({
    params: slaPolicyPriorityParamsSchema,
  }),
  getSlaPolicyController,
);

router.put(
  "/:priority",
  validateRequest({
    params: slaPolicyPriorityParamsSchema,
    body: upsertSlaPolicySchema,
  }),
  upsertSlaPolicyController,
);

router.patch(
  "/:priority/status",
  validateRequest({
    params: slaPolicyPriorityParamsSchema,
    body: updateSlaPolicyStatusSchema,
  }),
  updateSlaPolicyStatusController,
);

export default router;