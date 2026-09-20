import {
  TicketStatus,
  UserRole,
} from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { UpdateTicketBody } from "../ticket.schemas";
import type { TicketUpdateActor } from "../policies/ticket-update-scope.policy";
import { buildTicketUpdateScope } from "../policies/ticket-update-scope.policy";

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

const employeeEditableFields = new Set([
  "title",
  "description",
  "categoryId",
  "softwareId",
  "requestType",
  "centerId",
  "labId",
]);

const technicianEditableFields = new Set([
  "title",
  "description",
]);

const managerEditableFields = new Set([
  ...employeeEditableFields,
  "priority",
]);

const adminEditableFields = new Set([
  ...managerEditableFields,
]);

function assertAllowedFields(
  body: UpdateTicketBody,
  actor: TicketUpdateActor,
): void {
  let allowedFields: Set<string>;

  switch (actor.role) {
    case UserRole.EMPLOYEE:
      allowedFields = employeeEditableFields;
      break;

    case UserRole.TECHNICIAN:
      allowedFields = technicianEditableFields;
      break;

    case UserRole.CENTER_MANAGER:
      allowedFields = managerEditableFields;
      break;

    case UserRole.ADMIN:
      allowedFields = adminEditableFields;
      break;

    default:
      throw new AppError(
        "FORBIDDEN",
        "You are not allowed to update tickets.",
      );
  }

  const forbiddenFields = Object.keys(body).filter(
    (field) => !allowedFields.has(field),
  );

  if (forbiddenFields.length > 0) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to update one or more of the provided fields.",
      forbiddenFields.map((field) => ({
        field: `body.${field}`,
        message: "This field cannot be updated by your role.",
      })),
    );
  }
}

export async function updateTicketUseCase(
  ticketId: number,
  body: UpdateTicketBody,
  actor: TicketUpdateActor,
) {
  

  const hasSoftwareId = body.softwareId !== undefined;
  const hasRequestType = body.requestType !== undefined;

    if (hasSoftwareId !== hasRequestType) {
    throw new AppError(
        "VALIDATION_ERROR",
        "softwareId and requestType must be provided together.",
    );
    }

  return prisma.$transaction(async (tx) => {
    const scope = buildTicketUpdateScope(ticketId, actor);

    const existingTicket = await tx.ticket.findFirst({
      where: scope,
      select: {
        id: true,
        status: true,
        categoryId: true,
        softwareId: true,
        requestType: true,
        centerId: true,
        labId: true,
      },
    });

    if (!existingTicket) {
      throw new AppError("NOT_FOUND", "Ticket not found.");
    }

    // First, verify ticket access, then validate editable fields
    assertAllowedFields(body, actor);

    // Enforce the employee's OPEN-only editing rule.
    if (
      actor.role === UserRole.EMPLOYEE &&
      existingTicket.status !== TicketStatus.OPEN
    ) {
      throw new AppError(
        "CONFLICT",
        "You can only edit tickets while they are OPEN.",
      );
    }

    const resultingCenterId = body.centerId ?? existingTicket.centerId;
    const resultingLabId = body.labId ?? existingTicket.labId;
    if (actor.role === UserRole.CENTER_MANAGER) {
        const hasDestinationAccess = await tx.center.findFirst({
            where: {
            id: resultingCenterId,
            userAccess: {
                some: {
                userId: actor.userId,
                },
            },
            },
            select: {
            id: true,
            },
        });

        if (!hasDestinationAccess) {
            throw new AppError(
            "FORBIDDEN",
            "You are not authorized to move tickets to this center.",
            );
        }
        }

    // Validate the resulting center/lab pair, including when only one changes.
    const lab = await tx.lab.findFirst({
      where: {
        id: resultingLabId,
        centerId: resultingCenterId,
      },
      select: {
        id: true,
      },
    });

    if (!lab) {
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected lab does not belong to the selected center.",
        [
          {
            field: "body.labId",
            message: "Lab must belong to the resulting center.",
          },
        ],
      );
    }

    if (body.categoryId !== undefined) {
      const category = await tx.category.findUnique({
        where: { id: body.categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new AppError(
          "VALIDATION_ERROR",
          "The selected category does not exist.",
          [
            {
              field: "body.categoryId",
              message: "Choose an existing category.",
            },
          ],
        );
      }
    }

    const resultingSoftwareId =
      body.softwareId !== undefined
        ? body.softwareId
        : existingTicket.softwareId;

    const resultingRequestType =
      body.requestType !== undefined
        ? body.requestType
        : existingTicket.requestType;

    // Keep softwareId and requestType either both set or both cleared.
    if (
      (resultingSoftwareId === null) !==
      (resultingRequestType === null)
    ) {
      throw new AppError(
        "VALIDATION_ERROR",
        "softwareId and requestType must be provided together.",
        [
          {
            field: "body.softwareId",
            message:
              "Software and request type must either both be set or both be cleared.",
          },
        ],
      );
    }

    if (resultingSoftwareId !== null) {
      const software = await tx.software.findUnique({
        where: { id: resultingSoftwareId },
        select: { id: true },
      });

      if (!software) {
        throw new AppError(
          "VALIDATION_ERROR",
          "The selected software does not exist.",
          [
            {
              field: "body.softwareId",
              message: "Choose existing software.",
            },
          ],
        );
      }
    }

    const data: Prisma.TicketUpdateInput = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) {
      data.description = body.description;
    }
    if (body.categoryId !== undefined) {
      data.category = { connect: { id: body.categoryId } };
    }
    if (body.softwareId !== undefined) {
      data.software =
        body.softwareId === null
          ? { disconnect: true }
          : { connect: { id: body.softwareId } };
    }
    if (body.requestType !== undefined) {
      data.requestType = body.requestType;
    }
    if (body.centerId !== undefined) {
      data.center = { connect: { id: body.centerId } };
    }
    if (body.labId !== undefined) {
      data.lab = { connect: { id: body.labId } };
    }
    if (body.priority !== undefined) {
      data.priority = body.priority;
    }

    if (actor.role === UserRole.EMPLOYEE) {
    try {
        return await tx.ticket.update({
        where: {
            id: existingTicket.id,
            requesterId: actor.userId,
            status: TicketStatus.OPEN,
        },
        data,
        include: ticketInclude,
        });
    } catch (error) {
        if (
        error instanceof
            Error &&
        "code" in error &&
        error.code === "P2025"
        ) {
        throw new AppError(
            "CONFLICT",
            "You can only edit tickets while they are OPEN.",
        );
        }

        throw error;
    }
    }

    return tx.ticket.update({
    where: { id: existingTicket.id },
    data,
    include: ticketInclude,
    });
  });
}