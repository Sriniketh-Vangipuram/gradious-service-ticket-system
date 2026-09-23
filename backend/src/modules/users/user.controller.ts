import type { Request, Response } from "express";

import { getValidatedData } from "../../common/validation/validate-request";

import { userIdParamsSchema,listUsersQuerySchema, updateUserSpecializationsBodySchema } from "./user.schemas";
import { listUsersUseCase, updateUserSpecializationsUseCase } from "./user.use-case";

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

export async function updateUserSpecializationsController(
  req: Request,
  res: Response,
): Promise<void> {
  const authUser = req.authUser;

  if (!authUser) {
    res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      },
    });

    return;
  }

  const params = getValidatedData(
    req,
    {
      params: userIdParamsSchema,
    },
    "params",
  );

  const body = getValidatedData(
    req,
    {
      body: updateUserSpecializationsBodySchema,
    },
    "body",
  );

  const result = await updateUserSpecializationsUseCase(
    params.userId,
    body.specializations,
    {
      userId: authUser.userId,
      role: authUser.role,
    },
  );

  res.status(200).json({
    success: true,
    data: result,
  });
}