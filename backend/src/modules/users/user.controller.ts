import type { Request, Response } from "express";

import { getValidatedData } from "../../common/validation/validate-request";

import { 
  userIdParamsSchema,
  listUsersQuerySchema, 
  updateUserSpecializationsBodySchema,
  updateUserStatusBodySchema,
  updateUserRoleBodySchema,
  updateUserCenterAccessBodySchema,
  updateUserProfileBodySchema,
 } from "./user.schemas";

import { 
  listUsersUseCase, 
  updateUserSpecializationsUseCase, 
  getUserUseCase,
  updateUserStatusUseCase,
  updateUserRoleUseCase,
  updateUserCenterAccessUseCase,
  updateUserProfileUseCase,
 } from "./user.use-case";

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

export async function getUserController(
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

  const user = await getUserUseCase(
    params.userId,
    {
      userId: authUser.userId,
      role: authUser.role,
    },
  );

  res.status(200).json({
    success: true,
    data: user,
  });
}

export async function updateUserStatusController(
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
      body: updateUserStatusBodySchema,
    },
    "body",
  );

  const result = await updateUserStatusUseCase(
    params.userId,
    body.isActive,
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

export async function updateUserRoleController(
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
      body: updateUserRoleBodySchema,
    },
    "body",
  );

  const result = await updateUserRoleUseCase(
    params.userId,
    body.role,
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

export async function updateUserCenterAccessController(
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
      body: updateUserCenterAccessBodySchema,
    },
    "body",
  );

  const result = await updateUserCenterAccessUseCase(
    params.userId,
    body.centerIds,
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

export async function updateUserProfileController(
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
      body: updateUserProfileBodySchema,
    },
    "body",
  );

  const result = await updateUserProfileUseCase(
    params.userId,
    body,
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