import type { Request, Response, NextFunction } from "express";

import { getValidatedData } from "../../common/validation/validate-request";
import { sendSuccess } from "../../common/http/api-response";
import { createTicketSchema } from "./ticket.schemas";
import { createTicketUseCase } from "./use-cases/create-ticket.use-case";

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

        // The create-ticket use case will be connected in the next step.
        // Do not create the ticket directly from the controller

        const ticket = await createTicketUseCase(input,actor);

        sendSuccess( res,{ ticket }, 201);
        
    }
    catch(error){
        next(error);
    }
}