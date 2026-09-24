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
  getSlaPolicy,
  listSlaPolicies,
  updateSlaPolicyStatus,
  upsertSlaPolicy,
} from "./sla-policy.service";

import {
  slaPolicyPriorityParamsSchema,
  updateSlaPolicyStatusSchema,
  upsertSlaPolicySchema,
} from "./sla-policy.schemas";

export async function listSlaPoliciesController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const policies = await listSlaPolicies();

    sendSuccess(res, policies);
  } catch (error) {
    next(error);
  }
}

export async function getSlaPolicyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = getValidatedData(
      req,
      {
        params: slaPolicyPriorityParamsSchema,
      },
      "params",
    );

    const policy = await getSlaPolicy(
      params.priority,
    );

    if (!policy) {
      res.status(404).json({
        error: {
          code: "SLA_POLICY_NOT_FOUND",
          message: `No SLA policy exists for priority ${params.priority}.`,
        },
      });

      return;
    }

    sendSuccess(res, policy);
  } catch (error) {
    next(error);
  }
}

export async function upsertSlaPolicyController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = getValidatedData(
      req,
      {
        params: slaPolicyPriorityParamsSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: upsertSlaPolicySchema,
      },
      "body",
    );

    const policy = await upsertSlaPolicy(
      params.priority,
      body,
    );

    sendSuccess(res, policy);
  } catch (error) {
    next(error);
  }
}

export async function updateSlaPolicyStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = getValidatedData(
      req,
      {
        params: slaPolicyPriorityParamsSchema,
      },
      "params",
    );

    const body = getValidatedData(
      req,
      {
        body: updateSlaPolicyStatusSchema,
      },
      "body",
    );

    const policy = await updateSlaPolicyStatus(
      params.priority,
      body,
    );

    sendSuccess(res, policy);
  } catch (error) {
    next(error);
  }
}