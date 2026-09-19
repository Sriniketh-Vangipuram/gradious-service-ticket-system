
import type { Request, RequestHandler } from "express";
import { z } from "zod";

import { AppError } from "../errors/app-error";

type RequestSchemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

type RequestSection = "body" | "params" | "query";

type ValidatedData<T extends RequestSchemas> = {
  [K in keyof T]: T[K] extends z.ZodType
    ? z.output<T[K]>
    : never;
};

export const validateRequest = <T extends RequestSchemas>(
  schemas: T,
): RequestHandler => {
  return (req, _res, next) => {
    const validated: Partial<ValidatedData<T>> = {};

    const sections = ["body", "params", "query"] as const;

    for (const section of sections) {
      const schema = schemas[section];

      if (!schema) continue;

      const result = schema.safeParse(req[section]);

      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: `${section}.${issue.path.join(".")}`,
          message: issue.message,
        }));

        return next(
          new AppError(
            "VALIDATION_ERROR",
            "Request validation failed.",
            details,
          ),
        );
      }

      (
        validated as Record<RequestSection, unknown>
      )[section] = result.data;
    }

    req.validated = validated;
    return next();
  };
};

export const getValidatedData = <
  T extends RequestSchemas,
  K extends keyof T & RequestSection,
>(
  req: Request,
  _schemas: T,
  section: K,
): z.output<NonNullable<T[K]>> => {
  const validated = req.validated;

  if (
    !validated ||
    !Object.prototype.hasOwnProperty.call(validated, section)
  ) {
    throw new AppError(
      "INTERNAL_ERROR",
      `Request section "${section}" was accessed before validation.`,
    );
  }

  return validated[section] as z.output<NonNullable<T[K]>>;
};