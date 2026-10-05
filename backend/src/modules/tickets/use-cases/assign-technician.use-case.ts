import {
  AssignmentEvent,
  AssignmentType,
  NotificationType,
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";

import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { TicketTechnicianAssignmentActor } from "../policies/ticket-technician-assignment.policy";
import { buildTicketTechnicianAssignmentScope } from "../policies/ticket-technician-assignment.policy";

import type { AssignTechnicianBody } from "../ticket.schemas";

import { createNotifications } from "../../notifications/notification.service";
import { publishToUser } from "../../../socket/socket.server";
import { createAuditLog } from "../../audit/audit.service";


const ticketInclude = {
  requester: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  centerManager: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  assignee: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },

  center: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  lab: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },

  category: true,
  software: true,
} satisfies Prisma.TicketInclude;

export async function assignTechnicianUseCase(
  ticketId: number,
  body: AssignTechnicianBody,
  actor: TicketTechnicianAssignmentActor,
) {
  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findFirst({
      where: buildTicketTechnicianAssignmentScope(
        ticketId,
        actor,
      ),
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        centerId: true,
        requesterId: true,
        centerManagerId: true,
        assigneeId: true,
      },
    });

    if (!ticket) {
      throw new AppError(
        "NOT_FOUND",
        "Ticket not found.",
      );
    }

    if (ticket.centerManagerId === null) {
      throw new AppError(
        "VALIDATION_ERROR",
        "A center manager must be assigned before a technician can be assigned.",
        [
          {
            field: "body.technicianId",
            message:
              "Assign a center manager to the ticket first.",
          },
        ],
      );
    }

    if (ticket.assigneeId === body.technicianId) {
      return {
        ticket: await tx.ticket.findUniqueOrThrow({
          where: {
            id: ticket.id,
          },
          include: ticketInclude,
        }),
        recipientIds: [] as number[],
        assignmentEvent: null,
        changed: false,
      };
    }

    const technician = await tx.user.findFirst({
      where: {
        id: body.technicianId,
        role: UserRole.TECHNICIAN,
        isActive: true,
        centerAccess: {
          some: {
            centerId: ticket.centerId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!technician) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected technician is not active or is not authorized for this ticket's center.",
        [
          {
            field: "body.technicianId",
            message:
              "Choose an active technician authorized for the ticket's center.",
          },
        ],
      );
    }

    const assignmentEvent =
      ticket.assigneeId === null
        ? AssignmentEvent.ASSIGNED
        : AssignmentEvent.REASSIGNED;

    // await tx.ticket.update({
    //   where: {
    //     id: ticket.id,
    //   },
    //   data: {
    //     assignee: {
    //       connect: {
    //         id: body.technicianId,
    //       },
    //     },

    //     ...(ticket.assigneeId === null &&
    //     ticket.status === TicketStatus.TRIAGED
    //       ? {
    //           status: TicketStatus.ASSIGNED,
    //         }
    //       : {}),
    //   },
    // });

    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        assigneeId: ticket.assigneeId,
      },
      data: {
        assigneeId: body.technicianId,
        ...(ticket.assigneeId === null &&
        ticket.status === TicketStatus.TRIAGED
          ? {
              status: TicketStatus.ASSIGNED,
            }
          : {}),
      },
    });
    if (updateResult.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "Ticket assignment changed before it could be updated. Refresh and try again.",
      );
    }

    await tx.assignmentHistory.create({
      data: {
        ticketId: ticket.id,
        type: AssignmentType.TECHNICIAN,
        event: assignmentEvent,
        fromUserId: ticket.assigneeId,
        toUserId: body.technicianId,
        assignedById: actor.userId,
      },
    });

    await createAuditLog(
      {
        action: "TICKET_ASSIGNED",
        entityType: "TICKET",
        entityId: String(ticket.id),
        actorId: actor.userId,

        oldValue: {
          assignmentType: AssignmentType.TECHNICIAN,
          assigneeId: ticket.assigneeId,
        },

        newValue: {
          assignmentType: AssignmentType.TECHNICIAN,
          assigneeId: body.technicianId,
        },

        metadata: {
          assignmentEvent,
          ticketNumber: ticket.ticketNumber,
        },
      },
      tx,
    );

    const requesterNotifications =
      await createNotifications(tx, {
        recipientIds: [ticket.requesterId],
        type: NotificationType.TICKET_ASSIGNED,
        title:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? "Ticket technician changed"
            : "Technician assigned to your ticket",
        message:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? `The technician assigned to ticket ${ticket.ticketNumber} has been changed.`
            : `A technician has been assigned to ticket ${ticket.ticketNumber}.`,
        ticketId: ticket.id,
      });

    const technicianNotifications =
      await createNotifications(tx, {
        recipientIds: [body.technicianId],
        type: NotificationType.TICKET_ASSIGNED,
        title:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? "Ticket reassigned to you"
            : "New ticket assigned to you",
        message:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? `Ticket ${ticket.ticketNumber} has been reassigned to you.`
            : `Ticket ${ticket.ticketNumber} has been assigned to you.`,
        ticketId: ticket.id,
      });

    createdNotifications = [
      ...requesterNotifications,
      ...technicianNotifications,
    ];

    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: {
          id: ticket.id,
        },
        include: ticketInclude,
      }),
      recipientIds: [
        ...new Set([
          ticket.requesterId,
          body.technicianId,
        ]),
      ],
      assignmentEvent,
      changed: true,
    };
  },
   {
    maxWait: 5000,
    timeout: 15000,
  },
);

  if (result.changed) {
    for (const userId of result.recipientIds) {
      publishToUser(
        userId,
        "ticket:assignment_changed",
        {
          ticketId: result.ticket.id,
          centerId: result.ticket.centerId,
          centerManagerId: result.ticket.centerManagerId,
          assigneeId: result.ticket.assigneeId,
          assignmentType: AssignmentType.TECHNICIAN,
          assignmentEvent: result.assignmentEvent,
        },
      );
    }
  }

  if (result.changed) {
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

  return result.ticket;
}