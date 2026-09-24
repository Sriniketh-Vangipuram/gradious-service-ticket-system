import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../common/validation/validate-request";

import {
  createTicketSchema,
  ticketIdParamsSchema,
  listTicketsQuerySchema,
  updateTicketBodySchema,
  updateTicketParamsSchema,
  changeTicketStatusBodySchema,
  resolveTicketBodySchema,
  reopenTicketBodySchema,
  cancelTicketBodySchema,
  assignCenterManagerBodySchema,
  assignTechnicianBodySchema,

} from "./ticket.schemas";

import {
  createTicketController,
  getTicketController,
  listTicketsController,
  updateTicketController,
  changeTicketStatusController,
  resolveTicketController,
  confirmTicketClosureController,
  reopenTicketController,
  cancelTicketController,
  getEligibleTechniciansController,
  assignCenterManagerController,
  assignTechnicianController,
  getEligibleManagersController,
} from "./ticket.controller";

import commentRouter from "../comments/comment.routes";

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

ticketRouter.get(
  "/:ticketId/eligible-managers",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
  }),
  getEligibleManagersController,
);



ticketRouter.get(
  "/:ticketId/eligible-technicians",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
  }),
  getEligibleTechniciansController,
);

ticketRouter.patch(
  "/:ticketId/manager",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
    body: assignCenterManagerBodySchema,
  }),
  assignCenterManagerController,
);


ticketRouter.patch(
  "/:ticketId/technician",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
    body: assignTechnicianBodySchema,
  }),
  assignTechnicianController,
);

ticketRouter.patch(
  "/:ticketId/status",
  requireAuth,
  validateRequest({
    params: ticketIdParamsSchema,
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



ticketRouter.use("/:ticketId/comments", commentRouter);

export default ticketRouter;