import { UserRole } from "../../../generated/prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

export type UserManagementActor = {
  userId: number;
  role: UserRole;
};

export async function assertCanListUsers(
  actor: UserManagementActor,
  centerId?: number,
): Promise<void> {
  if (actor.role === UserRole.ADMIN) {
    return;
  }

  if (actor.role !== UserRole.CENTER_MANAGER) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to view users.",
    );
  }

  /*
   * If a center filter was provided, verify that the manager
   * has explicit access to that center.
   */
  if (centerId !== undefined) {
    const access = await prisma.userCenter.findUnique({
      where: {
        userId_centerId: {
          userId: actor.userId,
          centerId,
        },
      },
      select: {
        userId: true,
      },
    });

    if (!access) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have access to this center.",
      );
    }
  }
}