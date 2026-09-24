import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";

import { validateRequest } from "../../common/validation/validate-request";


import slaPolicyRoutes from "./policies/sla-policy.routes";

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

router.use("/policies", slaPolicyRoutes);

export default router;