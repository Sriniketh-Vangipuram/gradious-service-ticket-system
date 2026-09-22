import {
  NotificationType,
  Prisma,
} from "../../generated/prisma/client";

type NotificationTransaction = Prisma.TransactionClient;

type CreateNotificationsInput = {
  recipientIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: number;
  dedupeKey?: string;
};


export async function createNotifications(
  tx: NotificationTransaction,
  input: CreateNotificationsInput,
) {
  const recipientIds = [...new Set(input.recipientIds)];

  if (recipientIds.length === 0) {
    return [];
  }

  // Find preferences explicitly disabled for this notification type.
  const disabledPreferences =
    await tx.notificationPreference.findMany({
      where: {
        userId: { in: recipientIds },
        type: input.type,
        enabled: false,
      },
      select: {
        userId: true,
      },
    });

  const disabledUserIds = new Set(
    disabledPreferences.map((preference) => preference.userId),
  );

  const eligibleRecipientIds = recipientIds.filter(
    (userId) => !disabledUserIds.has(userId),
  );

  if (eligibleRecipientIds.length === 0) {
    return [];
  }

  const createdNotifications = [];

  for (const userId of eligibleRecipientIds) {
    try {
      const notification = await tx.notification.create({
        data: {
          userId,
          type: input.type,
          title: input.title,
          message: input.message,
          ticketId: input.ticketId,
          dedupeKey: input.dedupeKey
            ? `${input.dedupeKey}:user:${userId}`
            : undefined,
        },
      });

      createdNotifications.push(notification);
    } catch (error) {
      // Preserve the old skipDuplicates behavior for duplicate
      // notification dedupe keys.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }

      throw error;
    }
  }

  return createdNotifications;
}