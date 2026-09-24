import { Router } from "express";

import {
  requireAuth,
} from "../../middleware/auth.middleware";

import {
  requireRole,
} from "../../middleware/role.middleware";

import {
  validateRequest,
} from "../../common/validation/validate-request";

import {
  auditLogIdParamSchema,
  auditLogListQuerySchema,
} from "./audit.schemas";

import {
  getAuditLogController,
  listAuditLogsController,
} from "./audit.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    query: auditLogListQuerySchema,
  }),
  listAuditLogsController,
);

router.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validateRequest({
    params: auditLogIdParamSchema,
  }),
  getAuditLogController,
);

export default router;