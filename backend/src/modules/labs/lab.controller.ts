import type {
  Request,
  Response,
  NextFunction,
} from "express";
import type { LabReadRole } from "./lab.service";
import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";
import type { UserRole } from "../../generated/prisma/client";
import {
  labIdParamSchema,
  listLabsQuerySchema,
  createLabBodySchema,
  updateLabBodySchema,
  updateLabStatusBodySchema,
} from "./lab.schema";

import {
  listLabs,
  getLabById,
  createLab,
  updateLab,
  updateLabStatus,
} from "./lab.service";



const getLabReadRole = (
  role: UserRole,
): LabReadRole => {
  if (
    role === "ADMIN" ||
    role === "CENTER_MANAGER"
  ) {
    return role;
  }

  throw new Error(
    "Invalid role for lab access.",
  );
};


export async function listLabsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: listLabsQuerySchema,
      },
      "query",
    );

    const authUser = req.authUser!;

    const result = await listLabs(
      query,
      getLabReadRole(authUser.role),
      authUser.userId,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getLabController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { labId } = getValidatedData(
      req,
      {
        params: labIdParamSchema,
      },
      "params",
    );

    const authUser = req.authUser!;

    const lab = await getLabById(
      labId,
      getLabReadRole(authUser.role),
      authUser.userId,
    );

    sendSuccess(res, {
      lab,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLabController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = getValidatedData(
      req,
      {
        body: createLabBodySchema,
      },
      "body",
    );

    const lab = await createLab(
      body,
      req.authUser!.userId,
    );

    sendSuccess(
      res,
      {
        lab,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateLabController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { labId } = getValidatedData(
      req,
      {
        params: labIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateLabBodySchema,
      },
      "body",
    );

    const lab = await updateLab(
      labId,
      body,
      req.authUser!.userId,
    );

    sendSuccess(res, {
      lab,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLabStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { labId } = getValidatedData(
      req,
      {
        params: labIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateLabStatusBodySchema,
      },
      "body",
    );

    const lab = await updateLabStatus(
      labId,
      body,
      req.authUser!.userId,
    );

    sendSuccess(res, {
      lab,
    });
  } catch (error) {
    next(error);
  }
}