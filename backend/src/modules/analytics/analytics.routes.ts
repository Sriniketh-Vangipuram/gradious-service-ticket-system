import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  analyticsFilterSchema,
  ticketTrendSchema,
} from "./analytics.schemas";

import {
  getOverviewController,
  getTicketVolumeController,
  getTicketTrendsController,
  getTicketsByCenterController,
  getTicketsByCategoryController,
  getTicketsByPriorityController,
  getSlaComplianceController,
  getResponseTimeController,
  getResolutionTimeController,
  getTechnicianWorkloadController,
  getResolutionRateController,
} from "./analytics.controller";

const router = Router();

const analyticsRoles = [
  "ADMIN",
  "CENTER_MANAGER",
] as const;

router.get(
  "/overview",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getOverviewController,
);

router.get(
  "/ticket-volume",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getTicketVolumeController,
);

router.get(
  "/ticket-trends",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: ticketTrendSchema,
  }),
  getTicketTrendsController,
);

router.get(
  "/by-center",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getTicketsByCenterController,
);

router.get(
  "/by-category",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getTicketsByCategoryController,
);

router.get(
  "/by-priority",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getTicketsByPriorityController,
);

router.get(
  "/sla-compliance",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getSlaComplianceController,
);

router.get(
  "/response-time",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getResponseTimeController,
);

router.get(
  "/resolution-time",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getResolutionTimeController,
);

router.get(
  "/technician-workload",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getTechnicianWorkloadController,
);

router.get(
  "/resolution-rate",
  requireAuth,
  requireRole(...analyticsRoles),
  validateRequest({
    query: analyticsFilterSchema,
  }),
  getResolutionRateController,
);

export default router;