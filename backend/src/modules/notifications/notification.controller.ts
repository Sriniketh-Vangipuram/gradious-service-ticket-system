import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,

} from "./notification.use-case";


import { NotificationType } from "../../generated/prisma/enums";

function parsePositiveInteger(
  value: unknown,
  fallback: number,
): number | null {
  if (value === undefined) {
    return fallback;
  }

  if (
    typeof value !== "string" ||
    !/^[1-9]\d*$/.test(value)
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed)
    ? parsed
    : null;
}

export async function getNotificationsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.authUser?.userId;

    if (userId === undefined) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
    }

    const page = parsePositiveInteger(
      req.query.page,
      1,
    );

    const limit = parsePositiveInteger(
      req.query.limit,
      20,
    );

    if (page === null || limit === null || limit > 100) {
      return res.status(400).json({
        error: {
          code: "INVALID_PAGINATION",
          message:
            "page must be a positive integer; limit must be between 1 and 100",
        },
      });
    }

    const unreadOnlyParam = req.query.unreadOnly;

    if (
      unreadOnlyParam !== undefined &&
      unreadOnlyParam !== "true" &&
      unreadOnlyParam !== "false"
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_UNREAD_FILTER",
          message: "unreadOnly must be true or false",
        },
      });
    }

    const result = await getNotifications({
      userId,
      page,
      limit,
      unreadOnly: unreadOnlyParam === "true",
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationAsReadController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.authUser?.userId;

    if (userId === undefined) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
    }

    const notificationId = parsePositiveInteger(
      req.params.id,
      0,
    );

    if (notificationId === null) {
      return res.status(400).json({
        error: {
          code: "INVALID_NOTIFICATION_ID",
          message: "Notification ID must be a positive integer",
        },
      });
    }

    const result = await markNotificationAsRead({
      userId,
      notificationId,
    });

    if (!result.found) {
      return res.status(404).json({
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification was not found",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function markAllNotificationsAsReadController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.authUser?.userId;

    if (userId === undefined) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
    }

    const result = await markAllNotificationsAsRead({
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getNotificationPreferencesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.authUser?.userId;

    if (userId === undefined) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
    }

    const preferences = await getNotificationPreferences(userId);

    return res.status(200).json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateNotificationPreferencesController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.authUser?.userId;

    if (userId === undefined) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });
    }

    const body: unknown = req.body;

    if (
      typeof body !== "object" ||
      body === null ||
      !("preferences" in body) ||
      !Array.isArray(body.preferences) ||
      body.preferences.length === 0
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_PREFERENCES",
          message: "preferences must be a non-empty array",
        },
      });
    }

    const validTypes = new Set<string>(
      Object.values(NotificationType),
    );

    const seenTypes = new Set<string>();

    for (const item of body.preferences) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("type" in item) ||
        !("enabled" in item) ||
        typeof item.type !== "string" ||
        !validTypes.has(item.type) ||
        typeof item.enabled !== "boolean"
      ) {
        return res.status(400).json({
          error: {
            code: "INVALID_PREFERENCE_ITEM",
            message:
              "Each preference must contain a valid type and boolean enabled value",
          },
        });
      }

      if (seenTypes.has(item.type)) {
        return res.status(400).json({
          error: {
            code: "DUPLICATE_PREFERENCE_TYPE",
            message: "Each notification type may appear only once",
          },
        });
      }

      seenTypes.add(item.type);
    }

    const preferences = body.preferences.map((item) => ({
      type: item.type as NotificationType,
      enabled: item.enabled as boolean,
    }));

    const updated = await updateNotificationPreferences({
      userId,
      preferences,
    });

    return res.status(200).json({
      success: true,
      data: { preferences: updated },
    });
  } catch (error) {
    return next(error);
  }
}