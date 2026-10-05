import {
  NotificationType,
  TicketHistoryEvent,
  TicketStatus,
  UserRole,
} from "../../../../generated/prisma/client";

import { prisma } from "../../../../config/database";
import { AppError } from "../../../../common/errors/app-error";

import type { AuthenticatedUser } from "../../../../middleware/auth.middleware";
import type { RequestCancellationBody } from "../../ticket.schemas";

import {
  assertTicketLifecycleAccess,
  getTicketLifecycleScope,
} from "../../policies/ticket-lifecycle-access.policy";

import { createNotifications } from "../../../notifications/notification.service";
import { publishToUser } from "../../../../socket/socket.server";
import { createAuditLog } from "../../../audit/audit.service";

const cancellableStatuses: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.TRIAGED,
  TicketStatus.ASSIGNED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_FOR_USER,
];

export async function requestCancellationUseCase(
  ticketId: number,
  body: RequestCancellationBody,
  actor: AuthenticatedUser,
) {
  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    const scope = getTicketLifecycleScope(
      actor,
      "REQUEST_CANCELLATION",
      ticketId,
    );

    const ticket = await tx.ticket.findFirst({
      where: scope,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
      },
    });

    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    assertTicketLifecycleAccess(
      actor,
      "REQUEST_CANCELLATION",
      ticket,
    );

    if (!cancellableStatuses.includes(ticket.status)) {
      throw new AppError(
        "CONFLICT",
        "This ticket cannot be cancelled in its current status.",
      );
    }

    /*
     * Prevent duplicate pending cancellation requests.
     *
     * Since we are not adding a cancellation-request table,
     * TicketHistory is the source of truth for the workflow.
     */
    const latestCancellationHistory =
      await tx.ticketHistory.findFirst({
        where: {
          ticketId: ticket.id,
          event: {
            in: [
              TicketHistoryEvent.STATUS_CHANGED,
              TicketHistoryEvent.CANCELLED,
            ],
          },
          toValue: {
            in: [
              "CANCELLATION_REQUESTED",
              "CANCELLATION_REJECTED",
              TicketStatus.CANCELLED,
            ],
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],
        select: {
          id: true,
          toValue: true,
        },
      });

    if (
      latestCancellationHistory?.toValue ===
      "CANCELLATION_REQUESTED"
    ) {
      throw new AppError(
        "CONFLICT",
        "A cancellation request is already pending for this ticket.",
      );
    }

    if (ticket.status === TicketStatus.CANCELLED) {
      throw new AppError(
        "CONFLICT",
        "This ticket has already been cancelled.",
      );
    }

    const history = await tx.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        actorId: actor.userId,
        event: TicketHistoryEvent.STATUS_CHANGED,
        fromValue: ticket.status,
        toValue: "CANCELLATION_REQUESTED",
        description: body.reason,
      },
    });

    /*
     * We cannot add a new AuditAction without a migration.
     * Therefore we use the existing TICKET_STATUS_CHANGED
     * action and identify the lifecycle action in metadata.
     */
    await createAuditLog(
      {
        action: "TICKET_STATUS_CHANGED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,
        oldValue: {
          status: ticket.status,
        },
        newValue: {
          status: ticket.status,
        },
        metadata: {
          lifecycleAction: "REQUEST_CANCELLATION",
          ticketNumber: ticket.ticketNumber,
          cancellationRequestHistoryId: history.id,
          cancellationReason: body.reason,
        },
      },
      tx,
    );

    /*
     * Find active administrators.
     */
    const admins = await tx.user.findMany({
      where: {
        role: UserRole.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const adminIds = admins.map((admin) => admin.id);

    if (adminIds.length > 0) {
      const adminNotifications = await createNotifications(
        tx,
        {
          recipientIds: adminIds,
          type: NotificationType.TICKET_STATUS_CHANGED,
          title: "Cancellation request",
          message:
            `Center Manager requested cancellation for ` +
            `${ticket.ticketNumber}. Reason: ${body.reason}`,
          ticketId: ticket.id,
        },
      );

      createdNotifications.push(...adminNotifications);
    }

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      centerId: ticket.centerId,
      historyId: history.id,
    };
    },
    {
      maxWait: 5000,
      timeout: 15000,
    }
  );

  /*
   * Notify admins through the existing realtime notification
   * mechanism.
   */
  for (const notification of createdNotifications) {
    publishToUser(notification.userId, "notification:created", {
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      ticketId: notification.ticketId,
      createdAt: notification.createdAt,
    });
  }

  return result;
}