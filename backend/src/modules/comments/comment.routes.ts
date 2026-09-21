import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  createTicketCommentBodySchema,
  ticketCommentParamsSchema,
} from "./comment.schemas";

import {
  createTicketCommentController,
  listTicketCommentsController,
} from "./comment.controller";

const commentRouter = Router({ mergeParams: true });

commentRouter.get(
  "/",
  requireAuth,
  validateRequest({
    params: ticketCommentParamsSchema,
  }),
  listTicketCommentsController,
);

commentRouter.post(
  "/",
  requireAuth,
  validateRequest({
    params: ticketCommentParamsSchema,
    body: createTicketCommentBodySchema,
  }),
  createTicketCommentController,
);

export default commentRouter;