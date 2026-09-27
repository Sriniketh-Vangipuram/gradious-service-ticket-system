import {
  NotificationType,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { getBusinessMinutesBetween } from "../sla/business-calendar.service";
import { createNotifications } from "./notification.service";
import { publishToUser } from "../../socket/socket.server";

const TERMINAL_STATUSES: TicketStatus[] = [
  TicketStatus.RESOLVED,
  TicketStatus.CLOSED,
  TicketStatus.CANCELLED,
];

type AlertState = "at-risk" | "breached";

function getAlertState(
  now: Date,
  dueAt: Date,
  remainingBusinessMinutes: number,
  targetMinutes: number,
  thresholdPercent: number,
): AlertState | null {
  if (now >= dueAt) {
    return "breached";
  }

  const atRiskRemainingMinutes =
    targetMinutes * (1 - thresholdPercent / 100);

  if (remainingBusinessMinutes <= atRiskRemainingMinutes) {
    return "at-risk";
  }

  return null;
}

async function getSlaAlertRecipients(input: {
  requesterId: number;
  assigneeId: number | null;
  centerId: number;
  priority: TicketPriority;
}): Promise<number[]> {
  const recipientIds = [
    input.requesterId,
    ...(input.assigneeId !== null ? [input.assigneeId] : []),
  ];

  /*
   * CRITICAL SLA alerts are additionally escalated to
   * active center managers and admins who have access
   * to the ticket's center.
   */
  if (input.priority === TicketPriority.CRITICAL) {
    const centerLeaders = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [
            UserRole.CENTER_MANAGER,
            UserRole.ADMIN,
          ],
        },
        centerAccess: {
          some: {
            centerId: input.centerId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    recipientIds.push(
      ...centerLeaders.map((user) => user.id),
    );
  }

  return [...new Set(recipientIds)];
}

/**
 * Checks pending first-response SLAs and active resolution
 * SLA cycles, then creates deduplicated notifications.
 *
 * IMPORTANT:
 *
 * There is intentionally NO long-running interactive
 * Prisma transaction around this function.
 *
 * SLA calculations involve multiple database reads and
 * business-calendar calculations. Keeping all of those
 * operations inside one interactive transaction caused
 * Prisma P2028 transaction timeout errors when the
 * application was connected remotely to Clever Cloud.
 */
export async function checkSlaAlerts(
  now: Date = new Date(),
): Promise<void> {
  const createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  /*
   * =========================================================
   * 1. FIRST-RESPONSE SLA ALERTS
   * =========================================================
   */

  const tickets = await prisma.ticket.findMany({
    where: {
      firstResponseAt: null,
      firstResponseDueAt: {
        not: null,
      },
      status: {
        notIn: TERMINAL_STATUSES,
      },
    },
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      requesterId: true,
      assigneeId: true,
      centerId: true,
      priority: true,
      firstResponseDueAt: true,
      firstResponseTargetMinutes: true,
      atRiskThresholdPercent: true,
    },
  });

  for (const ticket of tickets) {
    if (
      ticket.firstResponseDueAt === null ||
      ticket.firstResponseTargetMinutes === null
    ) {
      continue;
    }

    const remainingBusinessMinutes =
      await getBusinessMinutesBetween({
        startAt:
          now < ticket.firstResponseDueAt
            ? now
            : ticket.firstResponseDueAt,
        endAt: ticket.firstResponseDueAt,
        centerId: ticket.centerId,
      });

    const state = getAlertState(
      now,
      ticket.firstResponseDueAt,
      remainingBusinessMinutes,
      ticket.firstResponseTargetMinutes,
      ticket.atRiskThresholdPercent,
    );

    if (!state) {
      continue;
    }

    const recipientIds =
      await getSlaAlertRecipients({
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
        centerId: ticket.centerId,
        priority: ticket.priority,
      });

    const breached = state === "breached";

    const notifications = await createNotifications(
      prisma,
      {
        recipientIds,

        type: breached
          ? NotificationType.SLA_BREACHED
          : NotificationType.SLA_AT_RISK,

        title: breached
          ? "First-response SLA breached"
          : "First-response SLA at risk",

        message: breached
          ? `Ticket ${ticket.ticketNumber} has exceeded its first-response SLA.`
          : `Ticket ${ticket.ticketNumber} is approaching its first-response SLA deadline.`,

        ticketId: ticket.id,

        dedupeKey:
          `ticket:${ticket.id}:first-response:${state}`,
      },
    );

    createdNotifications.push(
      ...notifications,
    );
  }

  /*
   * =========================================================
   * 2. RESOLUTION SLA ALERTS
   * =========================================================
   */

  const cycles = await prisma.ticketSlaCycle.findMany({
    where: {
      resolvedAt: null,
      pausedAt: null,
      ticket: {
        status: {
          notIn: TERMINAL_STATUSES,
        },
      },
    },
    select: {
      id: true,
      ticketId: true,
      startedAt: true,
      dueAt: true,
      targetMinutes: true,
      atRiskThresholdPercent: true,

      ticket: {
        select: {
          ticketNumber: true,
          requesterId: true,
          assigneeId: true,
          centerId: true,
          priority: true,
        },
      },
    },
  });

  for (const cycle of cycles) {
    const remainingBusinessMinutes =
      await getBusinessMinutesBetween({
        startAt:
          now < cycle.dueAt
            ? now
            : cycle.dueAt,
        endAt: cycle.dueAt,
        centerId: cycle.ticket.centerId,
      });

    const state = getAlertState(
      now,
      cycle.dueAt,
      remainingBusinessMinutes,
      cycle.targetMinutes,
      cycle.atRiskThresholdPercent,
    );

    if (!state) {
      continue;
    }

    const recipientIds =
      await getSlaAlertRecipients({
        requesterId: cycle.ticket.requesterId,
        assigneeId: cycle.ticket.assigneeId,
        centerId: cycle.ticket.centerId,
        priority: cycle.ticket.priority,
      });

    const breached = state === "breached";

    const notifications = await createNotifications(
      prisma,
      {
        recipientIds,

        type: breached
          ? NotificationType.SLA_BREACHED
          : NotificationType.SLA_AT_RISK,

        title: breached
          ? "Resolution SLA breached"
          : "Resolution SLA at risk",

        message: breached
          ? `Ticket ${cycle.ticket.ticketNumber} has exceeded its resolution SLA.`
          : `Ticket ${cycle.ticket.ticketNumber} is approaching its resolution SLA deadline.`,

        ticketId: cycle.ticketId,

        dedupeKey:
          `ticket:${cycle.ticketId}:cycle:${cycle.id}:resolution:${state}`,
      },
    );

    createdNotifications.push(
      ...notifications,
    );
  }

  /*
   * =========================================================
   * 3. PUBLISH REAL-TIME NOTIFICATIONS
   * =========================================================
   *
   * Database persistence happens before Socket.IO publishing.
   * Therefore clients only receive notifications that were
   * successfully persisted.
   */

  for (const notification of createdNotifications) {
    publishToUser(
      notification.userId,
      "notification:created",
      {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        ticketId: notification.ticketId,
        createdAt: notification.createdAt,
      },
    );
  }
}