import {
  AssignmentEvent,
  UserRole,
} from "../../../generated/prisma/client";

import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { TicketAssignmentActor } from "../policies/ticket-assignment-scope.policy";
import { buildTicketAssignmentScope } from "../policies/ticket-assignment-scope.policy";
import type { AssignTicketBody } from "../ticket.schemas";
import {
  NotificationType,
} from "../../../generated/prisma/client";

import { createNotifications } from "../../notifications/notification.service";
import { publishToUser } from "../../../socket/socket.server";

const ticketInclude = {
  requester: {
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

export async function assignTicketUseCase(
  ticketId: number,
  body: AssignTicketBody,
  actor: TicketAssignmentActor,
) {

  let createdNotifications: Awaited<
    ReturnType<typeof createNotifications>
  > = [];

  const result = await prisma.$transaction(async (tx) => {
    // 1. Confirm the actor can manage this ticket's assignment.
    const ticket = await tx.ticket.findFirst({
      where: buildTicketAssignmentScope(ticketId, actor),
      select: {
        id: true,
        centerId: true,
        requesterId:true,
        assigneeId: true,
      },
    });

    if (!ticket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    const newAssigneeId = body.assigneeId;

    // 2. If the assignment is unchanged, do not create duplicate history.
    if (ticket.assigneeId === newAssigneeId) {
      return {
        ticket: await tx.ticket.findUniqueOrThrow({
          where: { id: ticket.id },
          include: ticketInclude,
        }),
        recipientIds: [] as number[],
        assignmentEvent:null,
        changed: false,
      };
    }

    // 3. Validate the target technician, unless unassigning.
    if (newAssigneeId !== null) {
      const technician = await tx.user.findFirst({
        where: {
          id: newAssigneeId,
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
              field: "body.assigneeId",
              message:
                "Choose an active technician authorized for the ticket's center.",
            },
          ],
        );
      }
    }

    // 4. Determine the assignment-history event.
    const event =
      newAssigneeId === null
        ? AssignmentEvent.UNASSIGNED
        : ticket.assigneeId === null
          ? AssignmentEvent.ASSIGNED
          : AssignmentEvent.REASSIGNED;

    // 5. Update the ticket and record history atomically.
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        assignee:
          newAssigneeId === null
            ? { disconnect: true }
            : { connect: { id: newAssigneeId } },
      },
    });

    await tx.assignmentHistory.create({
      data: {
        ticketId: ticket.id,
        event,
        fromUserId: ticket.assigneeId,
        toUserId: newAssigneeId,
        assignedById: actor.userId,
      },
    });

    // 6. Notify the relevant people about the assignment change.
    const recipientIds: number[] = [ticket.requesterId];

    if (newAssigneeId !== null) {
      recipientIds.push(newAssigneeId);
    } else if (ticket.assigneeId !== null) {
      recipientIds.push(ticket.assigneeId);
    }

    const isUnassigned = newAssigneeId === null;

    createdNotifications =await createNotifications(tx, {
      recipientIds,
      type: NotificationType.TICKET_ASSIGNED,
      title: isUnassigned
        ? "Ticket unassigned"
        : ticket.assigneeId === null
          ? "Ticket assigned to you"
          : "Ticket reassigned",
      message: isUnassigned
        ? `Ticket #${ticket.id} has been unassigned.`
        : `Ticket #${ticket.id} has been ${
            ticket.assigneeId === null ? "assigned" : "reassigned"
          }.`,
      ticketId: ticket.id,
    });

    // 7. Return the updated ticket with safe related data.
    return {
      ticket: await tx.ticket.findUniqueOrThrow({
        where: { id: ticket.id },
        include: ticketInclude,
      }),
      recipientIds: [...new Set(recipientIds)],
      assignmentEvent: event,
      changed: true,
    };
  });
    if (result.changed) {
      for (const userId of result.recipientIds) {
        publishToUser(userId, "ticket:assignment_changed", {
          ticketId: result.ticket.id,
          centerId: result.ticket.centerId,
          assigneeId: result.ticket.assigneeId,
          assignmentEvent: result.assignmentEvent,
        });
      }
    }

    if (result.changed) {
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
    }

    return result.ticket;
}