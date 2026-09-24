import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getValidatedData,
} from "../../common/validation/validate-request";

import {
  sendSuccess,
} from "../../common/http/api-response";

import {
  listSlaTickets,
} from "./monitoring/sla-monitoring.service";

import {
  getSlaOverview,
} from "./monitoring/sla-overview.service";

import {
  listSlaTicketsQuerySchema,
  slaOverviewQuerySchema,
} from "./sla.schemas";

export async function listSlaTicketsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: listSlaTicketsQuerySchema,
      },
      "query",
    );

    const actor = req.authUser;

    if (!actor) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });

      return;
    }

    const result = await listSlaTickets(
      {
        userId: actor.userId,
        role: actor.role,
      },
      query,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getSlaOverviewController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      {
        query: slaOverviewQuerySchema,
      },
      "query",
    );

    const actor = req.authUser;

    if (!actor) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication is required",
        },
      });

      return;
    }

    const result = await getSlaOverview(
      {
        userId: actor.userId,
        role: actor.role,
      },
      query.centerId,
    );

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}