import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getValidatedData,
  } from "../../common/validation/validate-request";

import { sendSuccess } from "../../common/http/api-response";

import {
  getAuditLogById,
  listAuditLogs,
} from "./audit.service";

import {
  auditLogIdParamSchema,
  auditLogListQuerySchema,
} from "./audit.schemas";

import {
  decodeAuditCursor,
} from "./audit.cursor";

export async function listAuditLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = getValidatedData(
      req,
      {
        query: auditLogListQuerySchema,
      },
      "query",
    );

    const cursor = query.cursor
      ? decodeAuditCursor(query.cursor)
      : undefined;

    const result = await listAuditLogs({
      actorId: query.actorId,
      action: query.action,
      entityType: query.entityType,
      entityId: query.entityId,

      from: query.from,
      to: query.to,

      limit: query.limit,
      cursor,
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function getAuditLogController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const params = getValidatedData(
      req,
      {
        params: auditLogIdParamSchema,
      },
      "params",
    );

    const result = await getAuditLogById(params.id);

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}