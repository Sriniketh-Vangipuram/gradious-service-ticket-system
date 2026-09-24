import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import { validateRequest } from "../../common/validation/validate-request";

import {
  listSlaTicketsQuerySchema,
  slaOverviewQuerySchema,
} from "./sla.schemas";

import {
  listSlaTicketsController,
  getSlaOverviewController,
} from "./sla-monitoring.controller";

const router = Router();

router.get(
  "/tickets",
  requireAuth,
  validateRequest({
    query: listSlaTicketsQuerySchema,
  }),
  listSlaTicketsController,
);

router.get(
  "/overview",
  requireAuth,
  validateRequest({
    query: slaOverviewQuerySchema,
  }),
  getSlaOverviewController,
);

export default router;