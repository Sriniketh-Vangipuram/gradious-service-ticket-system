import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  createTicketSchema,
  ticketIdParamsSchema,
  listTicketsQuerySchema,
  updateTicketBodySchema,
  updateTicketParamsSchema,

} from "./ticket.schemas";

import {
  createTicketController,
  getTicketController,
  listTicketsController,
  updateTicketController,
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

export default ticketRouter;