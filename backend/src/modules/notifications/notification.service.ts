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
):Promise<void>{

    const recipientIds = [...new Set(input.recipientIds)];

    if(recipientIds.length===0){
        return;
    }


    // Find preferences explicitly disabled for this notification type.
    const disabledPreferences =
        await tx.notificationPreference.findMany({
            where:{
                userId: {in: recipientIds },
                type: input.type,
                enabled:false,
            },

            select:{
                userId:true,
            },
        });

    const disabledUserIds = new Set(
        disabledPreferences.map((preference)=>preference.userId),
    );

    const eligibleRecipientIds = recipientIds.filter(
        (userId)=> !disabledUserIds.has(userId),
    );

    if(eligibleRecipientIds.length===0){
        return;
    }

    await tx.notification.createMany({
        data: eligibleRecipientIds.map((userId)=>({
            userId,
            type:input.type,
            title:input.title,
            message: input.message,
            ticketId: input.ticketId,
            dedupeKey: input.dedupeKey
                ? `${input.dedupeKey}:user:${userId}`
                : undefined,
        })),

        skipDuplicates:true,
    });
}