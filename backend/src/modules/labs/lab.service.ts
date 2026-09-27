import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { AppError } from "../../common/errors/app-error";

import { createAuditLog } from "../audit/audit.service";

import type {
  CreateLabBody,
  ListLabsQuery,
  UpdateLabBody,
  UpdateLabStatusBody,
} from "./lab.schema";

export type LabReadRole =
  | "ADMIN"
  | "CENTER_MANAGER";
/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeLabCode = (code: string) => {
  return code.trim().toUpperCase();
};

const buildLabReadScope = (
  role: LabReadRole,
  userId: number,
): Prisma.LabWhereInput => {
  if (role === "ADMIN") {
    return {};
  }

  return {
    center: {
      userAccess: {
        some: {
          userId,
        },
      },
    },
  };
};

const handlePrismaUniqueError = (
  error: unknown,
): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(
      "CONFLICT",
      "A lab with the same code already exists in this center.",
    );
  }

  throw error;
};

/**
 * Ensures that a center exists and is active.
 *
 * Used when creating a lab or moving an existing lab
 * to another center.
 */
const ensureActiveCenter = async (
  centerId: number,
) => {
  const center = await prisma.center.findUnique({
    where: {
      id: centerId,
    },

    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
    },
  });

  if (!center) {
    throw new AppError(
      "NOT_FOUND",
      "Center not found.",
    );
  }

  if (!center.isActive) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Cannot assign a lab to an inactive center.",
    );
  }

  return center;
};

/* -------------------------------------------------------------------------- */
/* List labs                                                                  */
/* -------------------------------------------------------------------------- */

export const listLabs = async (
  query: ListLabsQuery,
  role: LabReadRole,
  userId: number,
) => {
  const {
    centerId,
    search,
    isActive,
    page,
    limit,
  } = query;

  const authorizationScope =
    buildLabReadScope(
      role,
      userId,
    );

  const where: Prisma.LabWhereInput = {
    ...authorizationScope,
  };

  if (centerId !== undefined) {
    where.centerId = centerId;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
        },
      },
      {
        code: {
          contains: search,
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [labs, total] =
    await prisma.$transaction([
      prisma.lab.findMany({
        where,

        skip,
        take: limit,

        orderBy: {
          name: "asc",
        },

        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          centerId: true,
          createdAt: true,
          updatedAt: true,

          center: {
            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          },

          _count: {
            select: {
              tickets: true,
              assignedUsers: true,
            },
          },
        },
      }),

      prisma.lab.count({
        where,
      }),
    ]);

  return {
    data: labs,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit,
      ),
    },
  };
};

/* -------------------------------------------------------------------------- */
/* Get lab                                                                    */
/* -------------------------------------------------------------------------- */

export const getLabById = async (
  labId: number,
  role: LabReadRole,
  userId: number,
) => {
  const authorizationScope =
    buildLabReadScope(
      role,
      userId,
    );

  const lab =
    await prisma.lab.findFirst({
      where: {
        id: labId,
        ...authorizationScope,
      },

      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        centerId: true,
        createdAt: true,
        updatedAt: true,

        center: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },

        _count: {
          select: {
            tickets: true,
            assignedUsers: true,
          },
        },
      },
    });

  if (!lab) {
    throw new AppError(
      "NOT_FOUND",
      "Lab not found.",
    );
  }

  return lab;
};

/* -------------------------------------------------------------------------- */
/* Create lab                                                                 */
/* -------------------------------------------------------------------------- */

export const createLab = async (
  body: CreateLabBody,
  actorId: number,
) => {
  const name = body.name.trim();
  const code = normalizeLabCode(
    body.code,
  );

  try {
    return await prisma.$transaction(
      async (tx) => {
        const center =
          await tx.center.findUnique({
            where: {
              id: body.centerId,
            },

            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
            },
          });

        if (!center) {
          throw new AppError(
            "NOT_FOUND",
            "Center not found.",
          );
        }

        if (!center.isActive) {
          throw new AppError(
            "VALIDATION_ERROR",
            "Cannot assign a lab to an inactive center.",
          );
        }

        const lab =
          await tx.lab.create({
            data: {
              centerId: body.centerId,
              name,
              code,
              isActive: true,
            },

            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
              centerId: true,
              createdAt: true,
              updatedAt: true,

              center: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });

        await createAuditLog(
          {
            action: "LAB_CREATED",
            entityType: "LAB",
            entityId: String(
              lab.id,
            ),
            actorId,

            newValue: {
              name: lab.name,
              code: lab.code,
              centerId:
                lab.centerId,
              isActive:
                lab.isActive,
            },
          },
          tx,
        );

        return lab;
      },
    );
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

/* -------------------------------------------------------------------------- */
/* Update lab                                                                 */
/* -------------------------------------------------------------------------- */

export const updateLab = async (
  labId: number,
  body: UpdateLabBody,
  actorId: number,
) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingLab =
          await tx.lab.findUnique({
            where: {
              id: labId,
            },

            select: {
              id: true,
              name: true,
              code: true,
              centerId: true,
              isActive: true,
            },
          });

        if (!existingLab) {
          throw new AppError(
            "NOT_FOUND",
            "Lab not found.",
          );
        }

        const data: Prisma.LabUpdateInput =
          {};

        if (
          body.name !== undefined
        ) {
          data.name =
            body.name.trim();
        }

        if (
          body.code !== undefined
        ) {
          data.code =
            normalizeLabCode(
              body.code,
            );
        }

        if (
          body.centerId !==
          undefined
        ) {
          const center =
            await tx.center.findUnique(
              {
                where: {
                  id: body.centerId,
                },

                select: {
                  id: true,
                  isActive: true,
                },
              },
            );

          if (!center) {
            throw new AppError(
              "NOT_FOUND",
              "Center not found.",
            );
          }

          if (!center.isActive) {
            throw new AppError(
              "VALIDATION_ERROR",
              "Cannot assign a lab to an inactive center.",
            );
          }

          data.center = {
            connect: {
              id: body.centerId,
            },
          };
        }

        const lab =
          await tx.lab.update({
            where: {
              id: labId,
            },

            data,

            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
              centerId: true,
              createdAt: true,
              updatedAt: true,

              center: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });

        await createAuditLog(
          {
            action: "LAB_UPDATED",
            entityType: "LAB",
            entityId: String(
              lab.id,
            ),
            actorId,

            oldValue: {
              name: existingLab.name,
              code: existingLab.code,
              centerId:
                existingLab.centerId,
              isActive:
                existingLab.isActive,
            },

            newValue: {
              name: lab.name,
              code: lab.code,
              centerId:
                lab.centerId,
              isActive:
                lab.isActive,
            },
          },
          tx,
        );

        return lab;
      },
    );
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

/* -------------------------------------------------------------------------- */
/* Update lab status                                                          */
/* -------------------------------------------------------------------------- */

export const updateLabStatus = async (
  labId: number,
  body: UpdateLabStatusBody,
  actorId: number,
) => {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingLab =
          await tx.lab.findUnique({
            where: {
              id: labId,
            },

            select: {
              id: true,
              name: true,
              code: true,
              centerId: true,
              isActive: true,
            },
          });

        if (!existingLab) {
          throw new AppError(
            "NOT_FOUND",
            "Lab not found.",
          );
        }

        if (
          existingLab.isActive ===
          body.isActive
        ) {
          const lab =
            await tx.lab.findUnique({
              where: {
                id: labId,
              },

              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
                centerId: true,
                createdAt: true,
                updatedAt: true,

                center: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            });

          if (!lab) {
            throw new AppError(
              "NOT_FOUND",
              "Lab not found.",
            );
          }

          return lab;
        }

        if (body.isActive) {
          const center =
            await tx.center.findUnique(
              {
                where: {
                  id: existingLab.centerId,
                },

                select: {
                  id: true,
                  isActive: true,
                },
              },
            );

          if (!center) {
            throw new AppError(
              "NOT_FOUND",
              "Center not found.",
            );
          }

          if (!center.isActive) {
            throw new AppError(
              "VALIDATION_ERROR",
              "Cannot activate a lab under an inactive center.",
            );
          }
        }

        const lab =
          await tx.lab.update({
            where: {
              id: labId,
            },

            data: {
              isActive:
                body.isActive,
            },

            select: {
              id: true,
              name: true,
              code: true,
              isActive: true,
              centerId: true,
              createdAt: true,
              updatedAt: true,

              center: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          });

        await createAuditLog(
          {
            action: "LAB_UPDATED",
            entityType: "LAB",
            entityId: String(
              lab.id,
            ),
            actorId,

            oldValue: {
              isActive:
                existingLab.isActive,
            },

            newValue: {
              isActive:
                lab.isActive,
            },

            metadata: {
              operation:
                "STATUS_CHANGE",
            },
          },
          tx,
        );

        return lab;
      },
    );
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};