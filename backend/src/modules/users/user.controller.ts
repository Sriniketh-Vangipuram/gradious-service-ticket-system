import type { Request, Response } from "express";

import { getValidatedData } from "../../common/validation/validate-request";

import { listUsersQuerySchema } from "./user.schemas";
import { listUsersUseCase } from "./user.use-case";

export async function listUsersController(
  req: Request,
  res: Response,
): Promise<void> {
  const query = getValidatedData(
    req,
    {
      query: listUsersQuerySchema,
    },
    "query",
  );

  const authUser = req.authUser;

  /*
   * requireAuth should always execute before this controller.
   */
  if (!authUser) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });

    return;
  }

  const result = await listUsersUseCase(query, {
    userId: authUser.userId,
    role: authUser.role,
  });

  res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}
