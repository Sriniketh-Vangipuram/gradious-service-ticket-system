import {
  NotificationType,
  TicketStatus,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { getBusinessMinutesBetween } from "../sla/business-calendar.service";
import { createNotifications } from "./notification.service";
import {
  TicketPriority,
  UserRole,
} from "../../generated/prisma/client";


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

async function persistSlaAlert(
  tx: Parameters<typeof createNotifications>[0],
  input: {
    recipientIds: number[];
    type: NotificationType;
    title: string;
    message: string;
    ticketId: number;
    dedupeKey: string;
  },
): Promise<void> {
  await createNotifications(tx, {
    ...input,
  });
}


async function getSlaAlertRecipients(
  tx: Parameters<typeof createNotifications>[0],
  input: {
    requesterId: number;
    assigneeId: number | null;
    centerId: number;
    priority: TicketPriority;
  },
): Promise<number[]> {
  const recipientIds = [
    input.requesterId,
    ...(input.assigneeId !== null ? [input.assigneeId] : []),
  ];

  // Escalate CRITICAL ticket SLA alerts to center-access
  // managers and admins only.
  if (input.priority === TicketPriority.CRITICAL) {
    const centerLeaders = await tx.user.findMany({
      where: {
        isActive: true,
        role: {
          in: [UserRole.CENTER_MANAGER, UserRole.ADMIN],
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

    recipientIds.push(...centerLeaders.map((user) => user.id));
  }

  return [...new Set(recipientIds)];
}
/**
 * Checks pending first-response SLAs and active resolution cycles,
 * then persists deduplicated in-app notifications.
 *
 * This function is intentionally not scheduled here.
 */
export async function checkSlaAlerts(
  now: Date = new Date(),
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Find tickets whose first response is still pending.
    const tickets = await tx.ticket.findMany({
      where: {
        firstResponseAt: null,
        firstResponseDueAt: { not: null },
        status: { notIn: TERMINAL_STATUSES },
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        requesterId: true,
        assigneeId: true,
        centerId: true,
        priority:true,
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
          startAt: now < ticket.firstResponseDueAt
            ? now
            : ticket.firstResponseDueAt,
          endAt: ticket.firstResponseDueAt,
          centerId: ticket.centerId,
          db: tx,
        });

      const state = getAlertState(
        now,
        ticket.firstResponseDueAt,
        remainingBusinessMinutes,
        ticket.firstResponseTargetMinutes,
        ticket.atRiskThresholdPercent,
      );

      if (!state) continue;

      const recipientIds = await getSlaAlertRecipients(tx, {
        requesterId: ticket.requesterId,
        assigneeId: ticket.assigneeId,
        centerId: ticket.centerId,
        priority: ticket.priority,
    });

      const breached = state === "breached";

      await persistSlaAlert(tx, {
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
      });
    }

    // 2. Find active, unresolved, unpaused resolution SLA cycles.
    const cycles = await tx.ticketSlaCycle.findMany({
      where: {
        resolvedAt: null,
        pausedAt: null,
        ticket: {
          status: { notIn: TERMINAL_STATUSES },
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
            priority:true,
          },
        },
      },
    });

    for (const cycle of cycles) {
      const remainingBusinessMinutes =
        await getBusinessMinutesBetween({
          startAt: now < cycle.dueAt ? now : cycle.dueAt,
          endAt: cycle.dueAt,
          centerId: cycle.ticket.centerId,
          db: tx,
        });

      const state = getAlertState(
        now,
        cycle.dueAt,
        remainingBusinessMinutes,
        cycle.targetMinutes,
        cycle.atRiskThresholdPercent,
      );

      if (!state) continue;

      const recipientIds = await getSlaAlertRecipients(tx, {
        requesterId: cycle.ticket.requesterId,
        assigneeId: cycle.ticket.assigneeId,
        centerId: cycle.ticket.centerId,
        priority: cycle.ticket.priority,
      });;

      if (cycle.ticket.assigneeId !== null) {
        recipientIds.push(cycle.ticket.assigneeId);
      }

      const breached = state === "breached";

      await persistSlaAlert(tx, {
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
      });
    }
  });
}