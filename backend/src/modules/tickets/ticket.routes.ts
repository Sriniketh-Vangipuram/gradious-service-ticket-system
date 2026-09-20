import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import { createTicketSchema } from "./ticket.schemas";
import { createTicketController } from "./ticket.controller";

const ticketRouter = Router();

ticketRouter.post(
  "/",
  requireAuth,
  validateRequest({
    body: createTicketSchema,
  }),
  createTicketController,
);

export default ticketRouter;