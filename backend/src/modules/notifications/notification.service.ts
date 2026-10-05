import {
  NotificationType,
  Prisma,
  PrismaClient,
} from "../../generated/prisma/client";

type NotificationDatabase =
  | PrismaClient
  | Prisma.TransactionClient;

type CreateNotificationsInput = {
  recipientIds: number[];
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: number;
  dedupeKey?: string;
};

function isPrismaUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createNotifications(
  tx: NotificationDatabase,
  input: CreateNotificationsInput,
) {
  const recipientIds = [...new Set(input.recipientIds)];

  if (recipientIds.length === 0) {
    return [];
  }

  /*
   * Find notification preferences that explicitly disable
   * this notification type.
   */
  const disabledPreferences =
    await tx.notificationPreference.findMany({
      where: {
        userId: {
          in: recipientIds,
        },
        type: input.type,
        enabled: false,
      },
      select: {
        userId: true,
      },
    });

  const disabledUserIds = new Set(
    disabledPreferences.map(
      (preference) => preference.userId,
    ),
  );

  /*
   * Only users who have not explicitly disabled this
   * notification type should receive the notification.
   */
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

          /*
           * The same logical SLA alert gets the same dedupe
           * key for each recipient.
           *
           * Example:
           *
           * ticket:42:first-response:breached:user:13
           */
          dedupeKey: input.dedupeKey
            ? `${input.dedupeKey}:user:${userId}`
            : undefined,
        },
      });

      createdNotifications.push(notification);
    } catch (error: unknown) {
      /*
       * SLA scans run every 60 seconds.
       *
       * If the same alert was already persisted, the unique
       * dedupeKey constraint is expected and should be treated
       * as an idempotent no-op.
       *
       * Do NOT let an already-existing notification fail the
       * entire SLA scan.
       */
      if (isPrismaUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  return createdNotifications;
}