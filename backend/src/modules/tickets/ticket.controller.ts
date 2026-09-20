import type { Request, Response, NextFunction } from "express";

import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";
import { createTicketSchema,ticketIdParamsSchema } from "./ticket.schemas";
import { createTicketUseCase } from "./use-cases/create-ticket.use-case";
import { getTicketUseCase } from "./use-cases/get-ticket.use-case";
import { listTicketsQuerySchema } from "./ticket.schemas";
import { listTicketsUseCase } from "./use-cases/list-tickets.use-case";
import {
  updateTicketParamsSchema,
  updateTicketBodySchema,
} from "./ticket.schemas";

import { updateTicketUseCase } from "./use-cases/update-ticket.use-case";

export async function createTicketController(
    req:Request,
    res:Response,
    next:NextFunction,
):Promise<void>{

    try{
        const input = getValidatedData(
            req,
            {body : createTicketSchema},
            "body",
        );

        const actor = req.authUser;

        if(!actor){
            return next(
                new Error("Authenticated user missing after requireAuth middleware."),
            );
        }

        const ticket = await createTicketUseCase(input,actor);

        sendSuccess( res,{ ticket }, 201);

    }
    catch(error){
        next(error);
    }
}

export async function getTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: ticketIdParamsSchema },
      "params",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await getTicketUseCase(ticketId, actor);

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}

export async function listTicketsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = getValidatedData(
      req,
      { query: listTicketsQuerySchema },
      "query",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const result = await listTicketsUseCase(query, actor);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function updateTicketController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { ticketId } = getValidatedData(
      req,
      { params: updateTicketParamsSchema },
      "params",
    );

    const body = getValidatedData(
      req,
      { body: updateTicketBodySchema },
      "body",
    );

    const actor = req.authUser;

    if (!actor) {
      return next(
        new Error(
          "Authenticated user missing after requireAuth middleware.",
        ),
      );
    }

    const ticket = await updateTicketUseCase(
      ticketId,
      body,
      actor,
    );

    sendSuccess(res, { ticket });
  } catch (error) {
    next(error);
  }
}