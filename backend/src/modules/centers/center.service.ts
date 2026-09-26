import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import type {
  CreateCenterBody,
  ListCentersQuery,
  UpdateCenterBody,
  UpdateCenterStatusBody,
} from "./center.schema";
import { createAuditLog } from "../audit/audit.service";

type CenterReadRole = "ADMIN" | "CENTER_MANAGER";

const normalizeCenterCode = (code: string) =>
  code.trim().toUpperCase();

const handlePrismaUniqueError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error(
      "A center with the same name or code already exists.",
    );
  }

  throw error;
};

/**
 * Builds the authorization scope for center reads.
 *
 * ADMIN:
 *   Can access every center.
 *
 * CENTER_MANAGER:
 *   Can only access centers explicitly assigned through UserCenter.
 *
 * The backend remains the source of truth for this scope.
 */
const buildCenterReadScope = (
  role: CenterReadRole,
  userId: number,
): Prisma.CenterWhereInput => {
  if (role === "ADMIN") {
    return {};
  }

  return {
    userAccess: {
      some: {
        userId,
      },
    },
  };
};

export const listCenters = async (
  query: ListCentersQuery,
  role: CenterReadRole,
  userId: number,
) => {
  const { search, isActive, page, limit } = query;

  const where: Prisma.CenterWhereInput = {
    ...buildCenterReadScope(role, userId),
  };

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

  const [centers, total] = await prisma.$transaction([
    prisma.center.findMany({
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            labs: true,
            tickets: true,
            primaryUsers: true,
            userAccess: true,
          },
        },
      },
    }),

    prisma.center.count({
      where,
    }),
  ]);

  return {
    data: centers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCenterById = async (
  centerId: number,
  role: CenterReadRole,
  userId: number,
) => {
  const scope = buildCenterReadScope(role, userId);

  const center = await prisma.center.findFirst({
    where: {
      AND: [
        {
          id: centerId,
        },
        scope,
      ],
    },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,

      _count: {
        select: {
          labs: true,
          tickets: true,
          primaryUsers: true,
          userAccess: true,
          holidays: true,
        },
      },

      labs: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!center) {
    throw new Error("Center not found.");
  }

  return center;
};

export const createCenter = async (
  body: CreateCenterBody,
  actorId: number,
) => {
  const name = body.name.trim();
  const code = normalizeCenterCode(body.code);

  try {
    return await prisma.$transaction(async (tx) => {
      const center = await tx.center.create({
        data: {
          name,
          code,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog(
        {
          action: "CENTER_CREATED",
          entityType: "CENTER",
          entityId: String(center.id),
          actorId,

          newValue: {
            name: center.name,
            code: center.code,
            isActive: center.isActive,
          },
        },
        tx,
      );

      return center;
    });
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

export const updateCenter = async (
  centerId: number,
  body: UpdateCenterBody,
  actorId: number,
) => {
  const existingCenter = await prisma.center.findUnique({
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

  if (!existingCenter) {
    throw new Error("Center not found.");
  }

  const data: Prisma.CenterUpdateInput = {};

  if (body.name !== undefined) {
    data.name = body.name.trim();
  }

  if (body.code !== undefined) {
    data.code = normalizeCenterCode(body.code);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updatedCenter = await tx.center.update({
        where: {
          id: centerId,
        },
        data,
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog(
        {
          action: "CENTER_UPDATED",
          entityType: "CENTER",
          entityId: String(centerId),
          actorId,

          oldValue: {
            name: existingCenter.name,
            code: existingCenter.code,
            isActive: existingCenter.isActive,
          },

          newValue: {
            name: updatedCenter.name,
            code: updatedCenter.code,
            isActive: updatedCenter.isActive,
          },
        },
        tx,
      );

      return updatedCenter;
    });
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

export const updateCenterStatus = async (
  centerId: number,
  body: UpdateCenterStatusBody,
  actorId: number,
) => {
  const existingCenter = await prisma.center.findUnique({
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

  if (!existingCenter) {
    throw new Error("Center not found.");
  }

  if (existingCenter.isActive === body.isActive) {
    return existingCenter;
  }

  /*
   * We intentionally do not delete or detach anything when a center
   * becomes inactive.
   *
   * Existing tickets, users, labs and historical relationships remain
   * associated with the center.
   *
   * Other workflows should prevent new business operations from using
   * an inactive center.
   */
  return prisma.$transaction(async (tx) => {
    const updatedCenter = await tx.center.update({
      where: {
        id: centerId,
      },
      data: {
        isActive: body.isActive,
      },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      {
        action: "CENTER_UPDATED",
        entityType: "CENTER",
        entityId: String(centerId),
        actorId,

        oldValue: {
          isActive: existingCenter.isActive,
        },

        newValue: {
          isActive: updatedCenter.isActive,
        },

        metadata: {
          operation: "STATUS_CHANGE",
        },
      },
      tx,
    );

    return updatedCenter;
  });
};