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

import type { TicketManagerAssignmentActor } from "../policies/ticket-manager-assignment.policy";
import { buildTicketManagerAssignmentScope } from "../policies/ticket-manager-assignment.policy";

import type { AssignCenterManagerBody } from "../ticket.schemas";

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

export async function assignCenterManagerUseCase(
  ticketId: number,
  body: AssignCenterManagerBody,
  actor: TicketManagerAssignmentActor,
) {
  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    /*
     * 1. Verify that the actor is allowed to manage
     *    center-manager assignment.
     */
    const ticket = await tx.ticket.findFirst({
      where: buildTicketManagerAssignmentScope(ticketId, actor),
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        centerId: true,
        requesterId: true,
        centerManagerId: true,
      },
    });

    if (!ticket) {
      throw new AppError(
        "NOT_FOUND",
        "Ticket not found.",
      );
    }

    /*
     * 2. Do not create duplicate assignment history
     *    if the same manager is already assigned.
     */
    if (ticket.centerManagerId === body.centerManagerId) {
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

    /*
     * 3. Validate the target center manager.
     *
     * Requirements:
     * - must exist
     * - must be CENTER_MANAGER
     * - must be active
     * - must have access to the ticket's center
     */
    const manager = await tx.user.findFirst({
      where: {
        id: body.centerManagerId,
        role: UserRole.CENTER_MANAGER,
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

    if (!manager) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected center manager is not active or is not authorized for this ticket's center.",
        [
          {
            field: "body.centerManagerId",
            message:
              "Choose an active center manager authorized for the ticket's center.",
          },
        ],
      );
    }

    /*
     * 4. Determine whether this is:
     *
     * first assignment:
     *   null → manager
     *
     * reassignment:
     *   manager A → manager B
     */
    const assignmentEvent =
      ticket.centerManagerId === null
        ? AssignmentEvent.ASSIGNED
        : AssignmentEvent.REASSIGNED;

    /*
     * 5. Update the ticket.
     *
     * Only the manager relationship changes here.
     *
     * We intentionally do NOT touch assigneeId.
     */

    const updateResult = await tx.ticket.updateMany({
      where: {
        id: ticket.id,
        centerManagerId: ticket.centerManagerId,
      },
      data: {
        centerManagerId: body.centerManagerId,
        ...(ticket.centerManagerId === null &&
        ticket.status === TicketStatus.OPEN
          ? {
              status: TicketStatus.TRIAGED,
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

    // await tx.ticket.update({
    //   where: {
    //     id: ticket.id,
    //   },

    //   data: {
    //     centerManager: {
    //       connect: {
    //         id: body.centerManagerId,
    //       },
    //     },

    //     /*
    //      * First manager assignment moves OPEN → TRIAGED.
    //      *
    //      * Reassignment does not blindly reset the ticket status.
    //      */
    //     ...(ticket.centerManagerId === null &&
    //     ticket.status === TicketStatus.OPEN
    //       ? {
    //           status: TicketStatus.TRIAGED,
    //         }
    //       : {}),
    //   },
    // });

    /*
     * 6. Record assignment history.
     */
    await tx.assignmentHistory.create({
      data: {
        ticketId: ticket.id,

        type: AssignmentType.CENTER_MANAGER,

        event: assignmentEvent,

        fromUserId: ticket.centerManagerId,

        toUserId: body.centerManagerId,

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
          assignmentType: AssignmentType.CENTER_MANAGER,
          centerManagerId: ticket.centerManagerId,
        },

        newValue: {
          assignmentType: AssignmentType.CENTER_MANAGER,
          centerManagerId: body.centerManagerId,
        },

        metadata: {
          assignmentEvent,
          ticketNumber: ticket.ticketNumber,
        },
      },
      tx,
    );

    /*
     * 7. Notify the requester.
     */
    const requesterNotifications =
      await createNotifications(tx, {
        recipientIds: [ticket.requesterId],

        type: NotificationType.TICKET_ASSIGNED,

        title:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? "Ticket manager changed"
            : "Ticket assigned to center manager",

        message:
          assignmentEvent === AssignmentEvent.REASSIGNED
            ? `The center manager for ticket ${ticket.ticketNumber} has been changed.`
            : `Your ticket ${ticket.ticketNumber} has been assigned to a center manager.`,

        ticketId: ticket.id,
      });

    /*
     * 8. Notify the newly assigned manager.
     */
    const managerNotifications =
      await createNotifications(tx, {
        recipientIds: [body.centerManagerId],

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
      ...managerNotifications,
    ];

    /*
     * 9. Return the fully populated ticket.
     */
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
          body.centerManagerId,
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

  /*
   * Socket events happen after the DB transaction commits.
   */
  if (result.changed) {
    for (const userId of result.recipientIds) {
      publishToUser(
        userId,
        "ticket:assignment_changed",
        {
          ticketId: result.ticket.id,
          centerId: result.ticket.centerId,
          centerManagerId:
            result.ticket.centerManagerId,
          assigneeId:
            result.ticket.assigneeId,
          assignmentType:
            AssignmentType.CENTER_MANAGER,
          assignmentEvent:
            result.assignmentEvent,
        },
      );
    }
  }

  /*
   * Publish notification events after commit.
   */
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