import type { Request, Response, NextFunction } from "express";

import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";

import {
  centerIdParamSchema,
  createCenterBodySchema,
  listCentersQuerySchema,
  updateCenterBodySchema,
  updateCenterStatusBodySchema,
} from "./center.schema";

import {
  createCenter,
  getCenterById,
  listCenters,
  updateCenter,
  updateCenterStatus,
} from "./center.service";

export async function listCentersController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: listCentersQuerySchema,
      },
      "query",
    );

    const result = await listCenters(query);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getCenterController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { centerId } = getValidatedData(
      req,
      {
        params: centerIdParamSchema,
      },
      "params",
    );

    const center = await getCenterById(centerId);

    sendSuccess(res, {
      center,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCenterController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = getValidatedData(
      req,
      {
        body: createCenterBodySchema,
      },
      "body",
    );

    const center = await createCenter(body,req.authUser!.userId);

    sendSuccess(
      res,
      {
        center,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateCenterController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { centerId } = getValidatedData(
      req,
      {
        params: centerIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateCenterBodySchema,
      },
      "body",
    );

    const center = await updateCenter(
      centerId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      center,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCenterStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { centerId } = getValidatedData(
      req,
      {
        params: centerIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateCenterStatusBodySchema,
      },
      "body",
    );

    const center = await updateCenterStatus(
      centerId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      center,
    });
  } catch (error) {
    next(error);
  }
}