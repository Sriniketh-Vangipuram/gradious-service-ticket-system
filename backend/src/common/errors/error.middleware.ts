import type { ErrorRequestHandler } from "express";
import { AppError } from "./app-error";

const HTTP_STATUS_BY_ERROR_CODE = {
    VALIDATION_ERROR:400,
    UNAUTHENTICATED:401,
    FORBIDDEN:403,
    NOT_FOUND:404,
    CONFLICT:409,
    INTERNAL_ERROR:500,
} as const;

type ParserError = Error & {
  status?: number;
  type?: string;
};

const isMalformedJsonError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;

  const parserError = error as ParserError;

  return (
    parserError.type === "entity.parse.failed" &&
    parserError.status === 400
  );
};

export const errorMiddleware: ErrorRequestHandler=(
    error,
    req,
    res,
    next,
)=>{
    // If a response already started, let Express handle the error
    if(res.headersSent){
        return next(error);
    }

    if (isMalformedJsonError(error)) {
        return res.status(400).json({
            success: false,
            error: {
            code: "VALIDATION_ERROR",
            message: "Invalid JSON request body.",
        },
    });
    }

    if(error instanceof AppError){
        const statusCode = HTTP_STATUS_BY_ERROR_CODE[error.code];

        // dont expose internal error messages or details to clients
        const message=
            error.code === "INTERNAL_ERROR"
            ? "An unexpected error occurred"
            : error.message

        if(statusCode>=500){
            req.log?.error(
                {err:error, code:error.code},
                "Application error"
            );
        }


        return res.status(statusCode).json({
            success:false,
            error:{
                code:error.code,
                message,
                ...(error.code === "VALIDATION_ERROR" && error.details
                ? {details : error.details}
                : {}
            )
            }
        });
    }

    // Unknown errors may contain database or infra details.
    req.log?.error({err:error}, "Unhandled application error");

    return res.status(500).json({
        success:false,
        error:{
            code:"INTERNAL_ERROR",
            message:"An unexpected error occurred",
        },
    });
};