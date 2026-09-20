import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  createTicketSchema,
  ticketIdParamsSchema,
  listTicketsQuerySchema,
  updateTicketBodySchema,
  updateTicketParamsSchema,
  assignTicketBodySchema,
  changeTicketStatusBodySchema,
  resolveTicketBodySchema,
  reopenTicketBodySchema,
  cancelTicketBodySchema,

} from "./ticket.schemas";

import {
  createTicketController,
  getTicketController,
  listTicketsController,
  updateTicketController,
  assignTicketController,
  changeTicketStatusController,
  resolveTicketController,
  confirmTicketClosureController,
  reopenTicketController,
  cancelTicketController,
} from "./ticket.controller";

const ticketRouter = Router();

ticketRouter.post(
  "/",
  requireAuth,
  validateRequest({
    body: createTicketSchema,
  }),
  createTicketController,
);

ticketRouter.get(
  "/",
  requireAuth,
  validateRequest({
    query: listTicketsQuerySchema,
  }),
  listTicketsController,
);

ticketRouter.get(
  "/:ticketId",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
  }),
  getTicketController,
);

ticketRouter.patch(
  "/:ticketId",
  requireAuth,
  validateRequest({
    params: updateTicketParamsSchema,
    body: updateTicketBodySchema,
  }),
  updateTicketController,
);

ticketRouter.patch(
  "/:ticketId/assignment",
  requireAuth,
  validateRequest({
    params: updateTicketParamsSchema,
    body: assignTicketBodySchema,
  }),
  assignTicketController,
);



ticketRouter.patch(
  "/:ticketId/status",
  requireAuth,
  validateRequest({
    params: updateTicketParamsSchema,
    body: changeTicketStatusBodySchema,
  }),
  changeTicketStatusController,
);

ticketRouter.post(
  "/:ticketId/resolve",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
    body: resolveTicketBodySchema,
  }),
  resolveTicketController,
);


ticketRouter.post(
  "/:ticketId/confirm-closure",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
  }),
  confirmTicketClosureController,
);

ticketRouter.post(
  "/:ticketId/reopen",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
    body: reopenTicketBodySchema,
  }),
  reopenTicketController,
);


ticketRouter.post(
  "/:ticketId/cancel",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
    body: cancelTicketBodySchema,
  }),
  cancelTicketController,
);

export default ticketRouter;