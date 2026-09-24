import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getValidatedData,
} from "../../../common/validation/validate-request";

import {
  sendSuccess,
} from "../../../common/http/api-response";

import {
  softwareIdParamSchema,
  listSoftwareQuerySchema,
  createSoftwareBodySchema,
  updateSoftwareBodySchema,
  updateSoftwareStatusBodySchema,
} from "./software.schemas";

import {
  listSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  updateSoftwareStatus,
} from "./software.service";

export async function listSoftwareController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: listSoftwareQuerySchema,
      },
      "query",
    );

    const result = await listSoftware(query);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getSoftwareController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { softwareId } = getValidatedData(
      req,
      {
        params: softwareIdParamSchema,
      },
      "params",
    );

    const software = await getSoftwareById(
      softwareId,
    );

    sendSuccess(res, {
      software,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSoftwareController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = getValidatedData(
      req,
      {
        body: createSoftwareBodySchema,
      },
      "body",
    );

    const software = await createSoftware(body,req.authUser!.userId);

    sendSuccess(
      res,
      {
        software,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function updateSoftwareController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { softwareId } = getValidatedData(
      req,
      {
        params: softwareIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateSoftwareBodySchema,
      },
      "body",
    );

    const software = await updateSoftware(
      softwareId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      software,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSoftwareStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { softwareId } = getValidatedData(
      req,
      {
        params: softwareIdParamSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateSoftwareStatusBodySchema,
      },
      "body",
    );

    const software = await updateSoftwareStatus(
      softwareId,
      body,
      req.authUser!.userId
    );

    sendSuccess(res, {
      software,
    });
  } catch (error) {
    next(error);
  }
}