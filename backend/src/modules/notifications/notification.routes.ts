import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import {
  getNotificationsController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
  getNotificationPreferencesController,
  updateNotificationPreferencesController,
} from "./notification.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  getNotificationsController,
);

router.patch(
  "/read-all",
  requireAuth,
  markAllNotificationsAsReadController,
);

router.patch(
  "/:id/read",
  requireAuth,
  markNotificationAsReadController,
);

router.get(
  "/preferences",
  requireAuth,
  getNotificationPreferencesController,
);

router.patch(
  "/preferences",
  requireAuth,
  updateNotificationPreferencesController,
);

export default router;