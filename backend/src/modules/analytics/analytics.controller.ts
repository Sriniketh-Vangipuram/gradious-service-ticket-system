import type { NextFunction, Request, Response } from "express";

import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";
import type { AnalyticsQuery } from "./analytics.types";
import {
  getAverageResolutionTime,
  getAverageResponseTime,
  getResolutionRate,
  getSlaCompliance,
  getTechnicianWorkload,
  getTicketTrends,
  getTicketVolume,
  getTicketsByCategory,
  getTicketsByCenter,
  getTicketsByPriority,
} from "./analytics.service";
import { prisma } from "../../config/database";
import { AppError } from "../../common/errors/app-error";
import {
  analyticsFilterSchema,
  ticketTrendSchema,
} from "./analytics.schemas";

async function buildAnalyticsQuery(
  req: Request,
  schema:
    | typeof analyticsFilterSchema
    | typeof ticketTrendSchema,
): Promise<AnalyticsQuery> {
  const filters = getValidatedData(req, {
    query: schema,
  }, "query");

  const from = new Date(filters.from);
  from.setHours(0, 0, 0, 0);

  const to = new Date(filters.to);
  to.setHours(23, 59, 59, 999);

  const authUser = req.authUser;

  if (!authUser) {
    throw new AppError(
      "UNAUTHENTICATED",
      "Authentication is required",
    );
  }

  if (authUser.role === "ADMIN") {
    return {
      ...filters,
      from,
      to,
      scope: {
        userId: authUser.userId,
        role: "ADMIN",
      },
    };
  }

  if (authUser.role !== "CENTER_MANAGER") {
    throw new AppError(
      "FORBIDDEN",
      "You do not have access to analytics",
    );
  }

  const centerAccess = await prisma.userCenter.findMany({
    where: {
      userId: authUser.userId,
    },
    select: {
      centerId: true,
    },
  });

  const centerIds = centerAccess.map(
    (item) => item.centerId,
  );

  return {
    ...filters,
    from,
    to,
    scope: {
      userId: authUser.userId,
      role: "CENTER_MANAGER",
      centerIds,
    },
  };
}

export async function getOverviewController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const [
      ticketVolume,
      slaCompliance,
      responseTime,
      resolutionTime,
      resolutionRate,
    ] = await Promise.all([
      getTicketVolume(query),
      getSlaCompliance(query),
      getAverageResponseTime(query),
      getAverageResolutionTime(query),
      getResolutionRate(query),
    ]);

    return sendSuccess(res, {
      ticketVolume,
      slaCompliance,
      responseTime,
      resolutionTime,
      resolutionRate,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getTicketVolumeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getTicketVolume(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getTicketTrendsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,ticketTrendSchema);

    const result = await getTicketTrends(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getTicketsByCenterController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getTicketsByCenter(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getTicketsByCategoryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getTicketsByCategory(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getTicketsByPriorityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getTicketsByPriority(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getSlaComplianceController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getSlaCompliance(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getResponseTimeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getAverageResponseTime(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getResolutionTimeController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getAverageResolutionTime(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getTechnicianWorkloadController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getTechnicianWorkload(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getResolutionRateController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = await buildAnalyticsQuery(req,analyticsFilterSchema);

    const result = await getResolutionRate(query);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}