import {
  NotificationType,
  SlaCycleOutcome,
  TicketHistoryEvent,
  TicketStatus,
  Prisma,
} from "../../../../generated/prisma/client";

import { AppError } from "../../../../common/errors/app-error";

import { createNotifications } from "../../../notifications/notification.service";
import { createAuditLog } from "../../../audit/audit.service";
import { getBusinessMinutesBetween } from "../../../sla/business-calendar.service";

type CancellationTransactionInput = {
  ticketId: number;
  ticketNumber: string;
  currentStatus: TicketStatus;
  requesterId: number;
  assigneeId: number | null;
  centerId: number;
  actorId: number;
  reason: string;
  db: Prisma.TransactionClient;

  lifecycleAction?:"CANCEL" | "APPROVE_CANCELLATION";
};

const cancellableStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.TRIAGED,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
];

export async function cancelTicketInTransaction({
  ticketId,
  ticketNumber,
  currentStatus,
  requesterId,
  assigneeId,
  centerId,
  actorId,
  reason,
  db,
  lifecycleAction="CANCEL",
}: CancellationTransactionInput) {
  if (!cancellableStatuses.includes(currentStatus)) {
    throw new AppError(
      "CONFLICT",
      "Only tickets that have not been resolved or closed can be cancelled.",
    );
  }

  const cancelledAt = new Date();

  /*
   * Optimistic concurrency protection.
   *
   * If another request changes the status between our
   * initial read and this update, count will be 0.
   */
  const updateResult = await db.ticket.updateMany({
    where: {
      id: ticketId,
      status: currentStatus,
    },
    data: {
      status: TicketStatus.CANCELLED,
    },
  });

  if (updateResult.count !== 1) {
    throw new AppError(
      "CONFLICT",
      "Ticket status changed before it could be cancelled. Refresh and try again.",
    );
  }

  /*
   * Close the active SLA cycle.
   */
  const activeSlaCycle = await db.ticketSlaCycle.findFirst({
    where: {
      ticketId,
      resolvedAt: null,
    },
    orderBy: {
      cycleNumber: "desc",
    },
    select: {
      id: true,
      pausedAt: true,
    },
  });

  if (activeSlaCycle) {
    let additionalPausedMinutes = 0;

    if (activeSlaCycle.pausedAt !== null) {
      const pausedBusinessMinutes =
        await getBusinessMinutesBetween({
          startAt: activeSlaCycle.pausedAt,
          endAt: cancelledAt,
          centerId,
          db,
        });

      additionalPausedMinutes =
        Math.round(pausedBusinessMinutes);
    }

    const slaCycleUpdateResult =
      await db.ticketSlaCycle.updateMany({
        where: {
          id: activeSlaCycle.id,
          resolvedAt: null,
        },
        data: {
          resolvedAt: cancelledAt,
          outcome: SlaCycleOutcome.CANCELLED,
          pausedAt: null,
          ...(additionalPausedMinutes > 0
            ? {
                totalPausedMinutes: {
                  increment: additionalPausedMinutes,
                },
              }
            : {}),
        },
      });

    if (slaCycleUpdateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "The SLA cycle changed before it could be cancelled. Refresh and try again.",
      );
    }

    await db.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        resolutionDueAt: null,
      },
    });
  }

  /*
   * Final cancellation history.
   *
   * The reason is intentionally stored here because
   * TicketHistory is already part of the existing schema
   * and is what we use as the audit trail for cancellation.
   */
  await db.ticketHistory.create({
    data: {
      ticketId,
      actorId,
      event: TicketHistoryEvent.CANCELLED,
      fromValue: currentStatus,
      toValue: TicketStatus.CANCELLED,
      description: reason,
    },
  });

  await createAuditLog(
    {
      action: "TICKET_CANCELLED",
      entityType: "TICKET",
      entityId: String(ticketId),
      actorId,
      oldValue: {
        status: currentStatus,
      },
      newValue: {
        status: TicketStatus.CANCELLED,
      },
      metadata: {
        lifecycleAction,
        ticketNumber,
        cancellationReason: reason,
      },
    },
    db,
  );

  /*
   * Notify requester.
   */
  const requesterNotifications =
    await createNotifications(db, {
      recipientIds: [requesterId],
      type: NotificationType.TICKET_STATUS_CHANGED,
      title: "Ticket cancelled",
      message: `Your ticket ${ticketNumber} has been cancelled. Reason: ${reason}`,
      ticketId,
    });

  /*
   * Notify assigned technician.
   */
  let technicianNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  if (assigneeId !== null) {
    technicianNotifications =
      await createNotifications(db, {
        recipientIds: [assigneeId],
        type: NotificationType.TICKET_STATUS_CHANGED,
        title: "Assigned ticket cancelled",
        message: `Ticket ${ticketNumber} has been cancelled. Reason: ${reason}`,
        ticketId,
      });
  }

  return {
    cancelledAt,
    recipientIds: [
      requesterId,
      ...(assigneeId !== null ? [assigneeId] : []),
    ],
    notifications: [
      ...requesterNotifications,
      ...technicianNotifications,
    ],
  };
}