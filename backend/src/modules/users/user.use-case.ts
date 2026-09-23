import { UserRole } from "../../generated/prisma/client";
import { prisma } from "../../config/database";

import {
  assertCanListUsers,
  type UserManagementActor,
} from "./policies/user-management.policy";

import type { ListUsersQuery } from "./user.schemas";

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