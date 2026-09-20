import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  createTicketSchema,
  ticketIdParamsSchema,
  listTicketsQuerySchema,

} from "./ticket.schemas";

import {
  createTicketController,
  getTicketController,
  listTicketsController,
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

export default ticketRouter;