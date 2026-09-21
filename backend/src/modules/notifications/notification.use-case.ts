import { prisma } from "../../config/database";
import { NotificationType } from "../../generated/prisma/client";

type GetNotificationsInput = {
  userId: number;
  page: number;
  limit: number;
  unreadOnly: boolean;
};

export async function getNotifications(
  input: GetNotificationsInput,
) {
  const { userId, page, limit, unreadOnly } = input;

  const where = {
    userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] =
    await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip,
        take: limit,
      }),

      prisma.notification.count({ where }),

      prisma.notification.count({
        where: {
          userId,
          readAt: null,
        },
      }),
    ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
}

type MarkNotificationReadInput = {
  userId: number;
  notificationId: number;
};

export async function markNotificationAsRead(
  input: MarkNotificationReadInput,
) {
  const { userId, notificationId } = input;

  const now = new Date();

  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: now,
    },
  });

  if (result.count === 0) {
    // Could be nonexistent, owned by another user,
    // or already read. Check ownership without exposing
    // another user's notification.
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
        readAt: true,
      },
    });

    if (!notification) {
      return { found: false as const };
    }

    return {
      found: true as const,
      alreadyRead: true,
      notificationId,
      readAt: notification.readAt,
    };
  }

  return {
    found: true as const,
    alreadyRead: false,
    notificationId,
    readAt: now,
  };
}

type MarkAllNotificationsReadInput = {
  userId: number;
};

export async function markAllNotificationsAsRead(
  input: MarkAllNotificationsReadInput,
) {
  const result = await prisma.notification.updateMany({
    where: {
      userId: input.userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return {
    updatedCount: result.count,
  };
}

export async function getNotificationPreferences(userId: number) {
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId },
    select: {
      type: true,
      enabled: true,
    },
  });

  const savedPreferences = new Map(
    preferences.map((preference) => [
      preference.type,
      preference.enabled,
    ]),
  );

  return Object.values(NotificationType).map((type) => ({
    type,
    enabled: savedPreferences.get(type) ?? true,
  }));
}

type UpdateNotificationPreferencesInput = {
  userId: number;
  preferences: {
    type: NotificationType;
    enabled: boolean;
  }[];
};

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferencesInput,
) {
  await prisma.$transaction(
    input.preferences.map((preference) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_type: {
            userId: input.userId,
            type: preference.type,
          },
        },
        create: {
          userId: input.userId,
          type: preference.type,
          enabled: preference.enabled,
        },
        update: {
          enabled: preference.enabled,
        },
      }),
    ),
  );

  return getNotificationPreferences(input.userId);
}