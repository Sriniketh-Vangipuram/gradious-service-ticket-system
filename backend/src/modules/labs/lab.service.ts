import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/database";

import type {
  CreateLabBody,
  ListLabsQuery,
  UpdateLabBody,
  UpdateLabStatusBody,
} from "./lab.schema";

const normalizeLabCode = (code: string) => {
  return code.trim().toUpperCase();
};

const handlePrismaUniqueError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error(
      "A lab with the same code already exists in this center.",
    );
  }

  throw error;
};

const ensureActiveCenter = async (centerId: number) => {
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
    throw new Error("Center not found.");
  }

  if (!center.isActive) {
    throw new Error("Cannot assign a lab to an inactive center.");
  }

  return center;
};

/**
 * List labs with filtering and pagination.
 */
export const listLabs = async (query: ListLabsQuery) => {
  const {
    centerId,
    search,
    isActive,
    page,
    limit,
  } = query;

  const where: Prisma.LabWhereInput = {};

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

  const [labs, total] = await prisma.$transaction([
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
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single lab.
 */
export const getLabById = async (labId: number) => {
  const lab = await prisma.lab.findUnique({
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
    throw new Error("Lab not found.");
  }

  return lab;
};

/**
 * Create a lab.
 */
export const createLab = async (body: CreateLabBody) => {
  const name = body.name.trim();
  const code = normalizeLabCode(body.code);

  // A lab can only belong to an active center.
  await ensureActiveCenter(body.centerId);

  try {
    return await prisma.lab.create({
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
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

/**
 * Update lab metadata/location.
 */
export const updateLab = async (
  labId: number,
  body: UpdateLabBody,
) => {
  const existingLab = await prisma.lab.findUnique({
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
    throw new Error("Lab not found.");
  }

  const data: Prisma.LabUpdateInput = {};

  if (body.name !== undefined) {
    data.name = body.name.trim();
  }

  if (body.code !== undefined) {
    data.code = normalizeLabCode(body.code);
  }

  if (body.centerId !== undefined) {
    await ensureActiveCenter(body.centerId);

    data.center = {
      connect: {
        id: body.centerId,
      },
    };
  }

  try {
    return await prisma.lab.update({
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
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

/**
 * Activate / deactivate a lab.
 */
export const updateLabStatus = async (
  labId: number,
  body: UpdateLabStatusBody,
) => {
  const existingLab = await prisma.lab.findUnique({
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
    throw new Error("Lab not found.");
  }

  if (existingLab.isActive === body.isActive) {
    return existingLab;
  }

  if (body.isActive) {
    await ensureActiveCenter(existingLab.centerId);
  }

  return prisma.lab.update({
    where: {
      id: labId,
    },

    data: {
      isActive: body.isActive,
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
};