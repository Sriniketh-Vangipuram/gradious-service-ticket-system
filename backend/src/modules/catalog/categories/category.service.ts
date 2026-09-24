import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../config/database";

import type {
  CreateCategoryBody,
  ListCategoriesQuery,
  UpdateCategoryBody,
  UpdateCategoryStatusBody,
} from "./category.schema";
import { createAuditLog } from "../../audit/audit.service";


const normalizeCategoryCode = (code: string) => {
  return code.trim().toUpperCase();
};

const handlePrismaUniqueError = (error: unknown): never => {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new Error(
      "A category with the same code already exists.",
    );
  }

  throw error;
};

/**
 * List categories with pagination, search and status filtering.
 */
export const listCategories = async (
  query: ListCategoriesQuery,
) => {
  const {
    search,
    isActive,
    page,
    limit,
  } = query;

  const where: Prisma.CategoryWhereInput = {};

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
      {
        description: {
          contains: search,
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
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
        description: true,
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

    prisma.category.count({
      where,
    }),
  ]);

  return {
    data: categories,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get a single category.
 */
export const getCategoryById = async (
  categoryId: number,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },

    select: {
      id: true,
      name: true,
      code: true,
      description: true,
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

  if (!category) {
    throw new Error("Category not found.");
  }

  return category;
};

/**
 * Create a category.
 */
export const createCategory = async (
  body: CreateCategoryBody,
  actorId: number,
) => {
  const name = body.name.trim();
  const code = normalizeCategoryCode(body.code);

  const description =
    body.description !== undefined
      ? body.description.trim() || null
      : null;

  try {
    return await prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          name,
          code,
          description,
          isActive: true,
        },

        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog(
        {
          action: "CATEGORY_CREATED",
          entityType: "CATEGORY",
          entityId: String(category.id),
          actorId,

          newValue: {
            name: category.name,
            code: category.code,
            description: category.description,
            isActive: category.isActive,
          },
        },
        tx,
      );

      return category;
    });
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

export const updateCategory = async (
  categoryId: number,
  body: UpdateCategoryBody,
  actorId: number,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingCategory =
        await tx.category.findUnique({
          where: {
            id: categoryId,
          },

          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            isActive: true,
          },
        });

      if (!existingCategory) {
        throw new Error("Category not found.");
      }

      const data: Prisma.CategoryUpdateInput = {};

      if (body.name !== undefined) {
        data.name = body.name.trim();
      }

      if (body.code !== undefined) {
        data.code = normalizeCategoryCode(body.code);
      }

      if (body.description !== undefined) {
        data.description =
          body.description === null
            ? null
            : body.description.trim() || null;
      }

      const category = await tx.category.update({
        where: {
          id: categoryId,
        },

        data,

        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog(
        {
          action: "CATEGORY_UPDATED",
          entityType: "CATEGORY",
          entityId: String(category.id),
          actorId,

          oldValue: {
            name: existingCategory.name,
            code: existingCategory.code,
            description: existingCategory.description,
            isActive: existingCategory.isActive,
          },

          newValue: {
            name: category.name,
            code: category.code,
            description: category.description,
            isActive: category.isActive,
          },
        },
        tx,
      );

      return category;
    });
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};

export const updateCategoryStatus = async (
  categoryId: number,
  body: UpdateCategoryStatusBody,
  actorId: number,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingCategory =
        await tx.category.findUnique({
          where: {
            id: categoryId,
          },

          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            isActive: true,
          },
        });

      if (!existingCategory) {
        throw new Error("Category not found.");
      }

      if (existingCategory.isActive === body.isActive) {
        return existingCategory;
      }

      const category = await tx.category.update({
        where: {
          id: categoryId,
        },

        data: {
          isActive: body.isActive,
        },

        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await createAuditLog(
        {
          action: "CATEGORY_UPDATED",
          entityType: "CATEGORY",
          entityId: String(category.id),
          actorId,

          oldValue: {
            isActive: existingCategory.isActive,
          },

          newValue: {
            isActive: category.isActive,
          },

          metadata: {
            operation: "STATUS_CHANGE",
          },
        },
        tx,
      );

      return category;
    });
  } catch (error) {
    handlePrismaUniqueError(error);
  }
};