import { UserRole, TechnicianSpecialization } from "../../generated/prisma/client";
import { prisma } from "../../config/database";
 
import {Prisma} from "../../generated/prisma/client"

import {
  assertCanListUsers,
  type UserManagementActor,
} from "./policies/user-management.policy";

import type { ListUsersQuery } from "./user.schemas";
import  { AppError } from "../../common/errors/app-error";
import { createAuditLog } from "../audit/audit.service";


export async function listUsersUseCase(
  query: ListUsersQuery,
  actor: UserManagementActor,
) {
  await assertCanListUsers(actor, query.centerId);

  const authorizationFilters = [];

  /*
   * CENTER_MANAGER authorization scope
   *
   * A manager can only see users associated with centers
   * that the manager themselves has access to.
   *
   * We intentionally use UserCenter rather than User.centerId
   * because centerId represents the user's primary center,
   * while UserCenter represents authorization scope.
   */
  if (actor.role === UserRole.CENTER_MANAGER) {
    authorizationFilters.push({
      centerAccess: {
        some: {
          center: {
            userAccess: {
              some: {
                userId: actor.userId,
              },
            },
          },
        },
      },
    });
  }

  /*
   * Optional center filter.
   *
   * If a specific center is requested, the user must have
   * access to that exact center.
   *
   * The authorization filter above still applies, so a manager
   * cannot query another center by simply changing centerId.
   */
  if (query.centerId !== undefined) {
    authorizationFilters.push({
      centerAccess: {
        some: {
          centerId: query.centerId,
        },
      },
    });
  }

  const where = {
    ...(authorizationFilters.length > 0
      ? {
          AND: authorizationFilters,
        }
      : {}),

    ...(query.search
      ? {
          OR: [
            {
              fullName: {
                contains: query.search,
              },
            },
            {
              email: {
                contains: query.search,
              },
            },
          ],
        }
      : {}),

    ...(query.role
      ? {
          role: query.role,
        }
      : {}),

    ...(query.labId !== undefined
      ? {
          labId: query.labId,
        }
      : {}),

    ...(query.specialization
      ? {
          specializations: {
            some: {
              specialization: query.specialization,
            },
          },
        }
      : {}),

    ...(query.isActive !== undefined
      ? {
          isActive: query.isActive,
        }
      : {}),
  };

  const users = await prisma.user.findMany({
    where,

    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,

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

      specializations: {
        select: {
          specialization: true,
        },
      },

      _count: {
        select: {
          assignedTickets: true,
        },
      },
    },

    orderBy: {
      id: "desc",
    },

    ...(query.cursor !== undefined
      ? {
          cursor: {
            id: query.cursor,
          },
          skip: 1,
        }
      : {}),

    take: query.limit + 1,
  });

  const hasNextPage = users.length > query.limit;

  const items = hasNextPage
    ? users.slice(0, query.limit)
    : users;

  const nextCursor = hasNextPage
    ? items[items.length - 1]?.id ?? null
    : null;

  return {
    items,
    pagination: {
      hasNextPage,
      nextCursor,
    },
  };
}

export async function updateUserSpecializationsUseCase(
  userId: number,
  specializations: TechnicianSpecialization[],
  actor: UserManagementActor,
) {
  /*
   * Only ADMIN and CENTER_MANAGER are allowed to reach this use case.
   *
   * The route already enforces the role, but we still keep the
   * domain authorization here because authorization must not depend
   * solely on HTTP routing.
   */
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.CENTER_MANAGER
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to manage user specializations.",
    );
  }

  /*
   * Load the target technician.
   *
   * We need:
   * - role → ensure this is actually a technician
   * - centerAccess → determine manager authorization scope
   */
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,

      centerAccess: {
        select: {
          centerId: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  /*
   * Specializations are meaningful only for technicians.
   */
  if (user.role !== UserRole.TECHNICIAN) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Only technicians can have specializations.",
    );
  }

  /*
   * ADMIN:
   * unrestricted management scope.
   */
  if (actor.role === UserRole.ADMIN) {
    await prisma.$transaction(async (tx) => {
      await tx.userSpecialization.deleteMany({
        where: {
          userId,
        },
      });

      if (specializations.length > 0) {
        await tx.userSpecialization.createMany({
          data: specializations.map((specialization) => ({
            userId,
            specialization,
          })),
        });
      }
    });
  }

  /*
   * CENTER_MANAGER:
   *
   * The technician must belong to at least one center
   * that the manager has access to.
   */
  if (actor.role === UserRole.CENTER_MANAGER) {
    const managerAccess = await prisma.userCenter.findFirst({
      where: {
        userId: actor.userId,
        centerId: {
          in: user.centerAccess.map(
            (access) => access.centerId,
          ),
        },
      },
      select: {
        centerId: true,
      },
    });

    if (!managerAccess) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have access to manage this technician.",
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSpecialization.deleteMany({
        where: {
          userId,
        },
      });

      if (specializations.length > 0) {
        await tx.userSpecialization.createMany({
          data: specializations.map((specialization) => ({
            userId,
            specialization,
          })),
        });
      }
    });
  }

  return {
    userId,
    specializations,
  };
}

export async function getUserUseCase(
  userId: number,
  actor: UserManagementActor,
) {
  /*
   * ADMIN can view any user.
   *
   * CENTER_MANAGER can only view users whose
   * center authorization overlaps with the manager's
   * own center access.
   */
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.CENTER_MANAGER
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to view users.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,

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

      centerAccess: {
        select: {
          center: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      specializations: {
        select: {
          specialization: true,
        },
      },

      _count: {
        select: {
          assignedTickets: true,
          requestedTickets: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  /*
   * ADMIN has unrestricted user visibility.
   */
  if (actor.role === UserRole.ADMIN) {
    return user;
  }

  /*
   * CENTER_MANAGER:
   *
   * The target user must have authorization access
   * to at least one center that the manager can access.
   */
  const managerCenterIds =
    await prisma.userCenter.findMany({
      where: {
        userId: actor.userId,
      },
      select: {
        centerId: true,
      },
    });

  const managerCenterIdSet = new Set(
    managerCenterIds.map(
      (access) => access.centerId,
    ),
  );

  const hasSharedCenter =
    user.centerAccess.some((access) =>
      managerCenterIdSet.has(access.center.id),
    );

  if (!hasSharedCenter) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have access to view this user.",
    );
  }

  return user;
}

export async function updateUserStatusUseCase(
  userId: number,
  isActive: boolean,
  actor: UserManagementActor,
) {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.CENTER_MANAGER
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to manage user status.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
      centerAccess: {
        select: {
          centerId: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  /*
   * Never allow an administrator to accidentally
   * deactivate their own account.
   */
  if (
    actor.role === UserRole.ADMIN &&
    actor.userId === userId &&
    !isActive
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "You cannot deactivate your own account.",
    );
  }

  /*
   * CENTER_MANAGER can only manage users whose
   * center access overlaps with the manager's scope.
   */
  if (actor.role === UserRole.CENTER_MANAGER) {
    const managerAccess = await prisma.userCenter.findFirst({
      where: {
        userId: actor.userId,
        centerId: {
          in: user.centerAccess.map(
            (access) => access.centerId,
          ),
        },
      },
      select: {
        centerId: true,
      },
    });

    if (!managerAccess) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have access to manage this user.",
      );
    }
  }

  if (user.isActive === isActive) {
    return {
      userId: user.id,
      isActive: user.isActive,
    };
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
  const updatedUser = await tx.user.update({
    where: {
      id: userId,
    },
    data: {
      isActive,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  /*
   * USER_DEACTIVATED specifically represents the
   * transition from active -> inactive.
   *
   * Reactivation is represented as USER_UPDATED because
   * the current AuditAction enum has no USER_REACTIVATED action.
   */
  await createAuditLog(
    {
      action: isActive
        ? "USER_UPDATED"
        : "USER_DEACTIVATED",

      entityType: "USER",
      entityId: String(user.id),

      actorId: actor.userId,

      oldValue: {
        isActive: user.isActive,
      },

      newValue: {
        isActive: updatedUser.isActive,
      },
    },
    tx,
  );

  return updatedUser;
});

return updatedUser;
}

export async function updateUserRoleUseCase(
  userId: number,
  role: UserRole,
  actor: UserManagementActor,
) {
  if (actor.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "Only administrators can change user roles.",
    );
  }

  if (actor.userId === userId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "You cannot change your own role.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  if (user.role === role) {
    return {
      userId: user.id,
      role: user.role,
    };
  }

 const updatedUser = await prisma.$transaction(async (tx) => {
  /*
   * Technician-only data must not remain attached
   * when the user stops being a technician.
   */
  if (role !== UserRole.TECHNICIAN) {
    await tx.userSpecialization.deleteMany({
      where: {
        userId,
      },
    });
  }

  const updatedUser = await tx.user.update({
    where: {
      id: userId,
    },
    data: {
      role,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await createAuditLog(
    {
      action: "ROLE_CHANGED",

      entityType: "USER",
      entityId: String(userId),

      actorId: actor.userId,

      oldValue: {
        role: user.role,
      },

      newValue: {
        role: updatedUser.role,
      },

      metadata: {
        specializationsCleared:
          role !== UserRole.TECHNICIAN,
      },
    },
    tx,
  );

  return updatedUser;
});

return updatedUser;
}

export async function updateUserCenterAccessUseCase(
  userId: number,
  centerIds: number[],
  actor: UserManagementActor,
) {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.CENTER_MANAGER
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to manage user center access.",
    );
  }

  if (actor.userId === userId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "You cannot change your own center access.",
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      centerId: true,
      centerAccess: {
        select: {
          centerId: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  /*
   * Verify every requested center exists and is active.
   *
   * We do this even when the array is empty.
   */
  const centers = await prisma.center.findMany({
    where: {
      id: {
        in: centerIds,
      },
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  const validCenterIds = new Set(
    centers.map((center) => center.id),
  );

  const invalidCenterIds = centerIds.filter(
    (centerId) => !validCenterIds.has(centerId),
  );

  if (invalidCenterIds.length > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      `The following centers do not exist or are inactive: ${invalidCenterIds.join(", ")}.`,
    );
  }

  /*
   * CENTER_MANAGER can only grant access to centers
   * that the manager themselves can access.
   */
  if (actor.role === UserRole.CENTER_MANAGER) {
    const managerAccess = await prisma.userCenter.findMany({
      where: {
        userId: actor.userId,
      },
      select: {
        centerId: true,
      },
    });

    const managerCenterIds = new Set(
      managerAccess.map((access) => access.centerId),
    );

    const unauthorizedCenterIds = centerIds.filter(
      (centerId) => !managerCenterIds.has(centerId),
    );

    if (unauthorizedCenterIds.length > 0) {
      throw new AppError(
        "FORBIDDEN",
        "You cannot grant access to centers outside your own center scope.",
      );
    }

    /*
     * The manager must also already have scope over
     * the target user.
     *
     * This prevents a manager from acquiring control
     * over a completely unrelated user simply by
     * assigning them one of their centers.
     */
    const targetSharesManagerCenter = targetUser.centerAccess.some(
      (access) => managerCenterIds.has(access.centerId),
    );

    if (!targetSharesManagerCenter) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have access to manage this user.",
      );
    }
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    /*
     * Replace the authorization set atomically.
     *
     * We deliberately do NOT modify User.centerId.
     */
    await tx.userCenter.deleteMany({
      where: {
        userId,
      },
    });

    if (centerIds.length > 0) {
      await tx.userCenter.createMany({
        data: centerIds.map((centerId) => ({
          userId,
          centerId,
        })),
      });
    }

    return tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        center: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        centerAccess: {
          select: {
            center: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            centerId: "asc",
          },
        },
        updatedAt: true,
      },
    });
  });

  if (!updatedUser) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  return updatedUser;
}

export async function updateUserProfileUseCase(
  userId: number,
  data: {
    fullName?: string;
    email?: string;
  },
  actor: UserManagementActor,
) {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.CENTER_MANAGER
  ) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to update user profiles.",
    );
  }

  if (actor.userId === userId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Use the account profile flow to update your own profile.",
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      centerAccess: {
        select: {
          centerId: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new AppError(
      "NOT_FOUND",
      "User was not found.",
    );
  }

  /*
   * CENTER_MANAGER can only modify users
   * inside their own center scope.
   */
  if (actor.role === UserRole.CENTER_MANAGER) {
    const sharedCenter = await prisma.userCenter.findFirst({
      where: {
        userId: actor.userId,
        centerId: {
          in: targetUser.centerAccess.map(
            (access) => access.centerId,
          ),
        },
      },
      select: {
        centerId: true,
      },
    });

    if (!sharedCenter) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have access to manage this user.",
      );
    }
  }

  try {
  return await prisma.$transaction(async (tx) => {
    const oldUser = await tx.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!oldUser) {
      throw new AppError(
        "NOT_FOUND",
        "User was not found.",
      );
    }

    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        ...(data.fullName !== undefined && {
          fullName: data.fullName,
        }),

        ...(data.email !== undefined && {
          email: data.email,
        }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
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
        updatedAt: true,
      },
    });

    await createAuditLog(
      {
        action: "USER_UPDATED",

        entityType: "USER",
        entityId: String(userId),

        actorId: actor.userId,

        oldValue: {
          fullName: oldUser.fullName,
          email: oldUser.email,
        },

        newValue: {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
        },
      },
      tx,
    );

    return updatedUser;
  });
} catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    throw new AppError(
      "CONFLICT",
      "A user with this email address already exists.",
    );
  }

  throw error;
}
}