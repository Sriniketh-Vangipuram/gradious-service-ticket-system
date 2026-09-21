import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../common/errors/app-error";
import { sendSuccess } from "../../common/http/api-response";
import { getValidatedData } from "../../common/validation/validate-request";

import {
  createTicketCommentBodySchema,
  ticketCommentParamsSchema,
} from "./comment.schemas";

import { createTicketComment } from "./use-cases/create-ticket-comment.use-case";
import { listTicketComments } from "./use-cases/list-ticket-comments.use-case";

export async function createTicketCommentController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketCommentParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: createTicketCommentBodySchema },
      "body",
    );

    if (!req.authUser) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.");
    }

    const comment = await createTicketComment(
      ticketId,
      body,
      req.authUser,
    );

    sendSuccess(res, { comment }, 201);
  } catch (error) {
    next(error);
  }
}

export async function listTicketCommentsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketCommentParamsSchema },
      "params",
    );

    if (!req.authUser) {
      throw new AppError("UNAUTHENTICATED", "Authentication required.");
    }

    const comments = await listTicketComments(
      ticketId,
      req.authUser,
    );

    sendSuccess(res, { comments });
  } catch (error) {
    next(error);
  }
}