import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../config/database";

import { createAuditLog } from "../../audit/audit.service";

import type {
  CreateSoftwareBody,
  ListSoftwareQuery,
  UpdateSoftwareBody,
  UpdateSoftwareStatusBody,
} from "./software.schemas";

/**
 * Normalize optional text fields.
 *
 * Empty strings are stored as null because vendor/version
 * are optional database fields.
 */
const normalizeNullableText = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
};

/**
 * List software with filtering and pagination.
 */
export const listSoftware = async (
  query: ListSoftwareQuery,
) => {
  const {
    search,
    vendor,
    isActive,
    licenseRequired,
    page,
    limit,
  } = query;

  const where: Prisma.SoftwareWhereInput = {};

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (licenseRequired !== undefined) {
    where.licenseRequired = licenseRequired;
  }

  if (vendor) {
    where.vendor = {
      contains: vendor,
    };
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
        },
      },
      {
        vendor: {
          contains: search,
        },
      },
      {
        version: {
          contains: search,
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [software, total] = await prisma.$transaction([
    prisma.software.findMany({
      where,
      skip,
      take: limit,

      orderBy: [
        {
          name: "asc",
        },
        {
          id: "asc",
        },
      ],

      select: {
        id: true,
        name: true,
        vendor: true,
        version: true,
        licenseRequired: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        _count: {
          select: {
            tickets: true,
          },
        },
      },
    }),

    prisma.software.count({
      where,
    }),
  ]);

  return {
    data: software,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single software catalog entry.
 */
export const getSoftwareById = async (
  softwareId: number,
) => {
  const software = await prisma.software.findUnique({
    where: {
      id: softwareId,
    },

    select: {
      id: true,
      name: true,
      vendor: true,
      version: true,
      licenseRequired: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,

      _count: {
        select: {
          tickets: true,
        },
      },
    },
  });

  if (!software) {
    throw new Error("Software not found.");
  }

  return software;
};

/**
 * Create software.
 */
export const createSoftware = async (
  body: CreateSoftwareBody,
  actorId: number,
) => {
  const name = body.name.trim();

  const vendor =
    normalizeNullableText(body.vendor) ?? null;

  const version =
    normalizeNullableText(body.version) ?? null;

  return prisma.$transaction(async (tx) => {
    const software = await tx.software.create({
      data: {
        name,
        vendor,
        version,
        licenseRequired: body.licenseRequired,
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        vendor: true,
        version: true,
        licenseRequired: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      {
        action: "SOFTWARE_CREATED",
        entityType: "SOFTWARE",
        entityId: String(software.id),
        actorId,

        newValue: {
          name: software.name,
          vendor: software.vendor,
          version: software.version,
          licenseRequired: software.licenseRequired,
          isActive: software.isActive,
        },
      },
      tx,
    );

    return software;
  });
};

/**
 * Update software metadata.
 */
export const updateSoftware = async (
  softwareId: number,
  body: UpdateSoftwareBody,
  actorId: number,
) => {
  return prisma.$transaction(async (tx) => {
    const existingSoftware =
      await tx.software.findUnique({
        where: {
          id: softwareId,
        },

        select: {
          id: true,
          name: true,
          vendor: true,
          version: true,
          licenseRequired: true,
          isActive: true,
        },
      });

    if (!existingSoftware) {
      throw new Error("Software not found.");
    }

    const data: Prisma.SoftwareUpdateInput = {};

    if (body.name !== undefined) {
      data.name = body.name.trim();
    }

    if (body.vendor !== undefined) {
      data.vendor = normalizeNullableText(body.vendor);
    }

    if (body.version !== undefined) {
      data.version = normalizeNullableText(body.version);
    }

    if (body.licenseRequired !== undefined) {
      data.licenseRequired = body.licenseRequired;
    }

    const software = await tx.software.update({
      where: {
        id: softwareId,
      },

      data,

      select: {
        id: true,
        name: true,
        vendor: true,
        version: true,
        licenseRequired: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      {
        action: "SOFTWARE_UPDATED",
        entityType: "SOFTWARE",
        entityId: String(software.id),
        actorId,

        oldValue: {
          name: existingSoftware.name,
          vendor: existingSoftware.vendor,
          version: existingSoftware.version,
          licenseRequired: existingSoftware.licenseRequired,
          isActive: existingSoftware.isActive,
        },

        newValue: {
          name: software.name,
          vendor: software.vendor,
          version: software.version,
          licenseRequired: software.licenseRequired,
          isActive: software.isActive,
        },
      },
      tx,
    );

    return software;
  });
};

/**
 * Activate / deactivate software.
 */
export const updateSoftwareStatus = async (
  softwareId: number,
  body: UpdateSoftwareStatusBody,
  actorId: number,
) => {
  return prisma.$transaction(async (tx) => {
    const existingSoftware =
      await tx.software.findUnique({
        where: {
          id: softwareId,
        },

        select: {
          id: true,
          name: true,
          vendor: true,
          version: true,
          licenseRequired: true,
          isActive: true,
        },
      });

    if (!existingSoftware) {
      throw new Error("Software not found.");
    }

    if (existingSoftware.isActive === body.isActive) {
      return existingSoftware;
    }

    const software = await tx.software.update({
      where: {
        id: softwareId,
      },

      data: {
        isActive: body.isActive,
      },

      select: {
        id: true,
        name: true,
        vendor: true,
        version: true,
        licenseRequired: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog(
      {
        action: "SOFTWARE_UPDATED",
        entityType: "SOFTWARE",
        entityId: String(software.id),
        actorId,

        oldValue: {
          isActive: existingSoftware.isActive,
        },

        newValue: {
          isActive: software.isActive,
        },

        metadata: {
          operation: "STATUS_CHANGE",
        },
      },
      tx,
    );

    return software;
  });
};