import { UserRole } from "../../../generated/prisma/client";
import type { Prisma } from "../../../generated/prisma/client";

import { AppError } from "../../../common/errors/app-error";

export type TicketAssignmentActor = {
  userId: number;
  role: string;
};

export function buildTicketAssignmentScope(
    ticketId:number,
    actor:TicketAssignmentActor,
):Prisma.TicketWhereInput{
    switch(actor.role){

        case UserRole.ADMIN:
            return{
                id:ticketId,
            };

        case UserRole.CENTER_MANAGER:
            return {
                id:ticketId,
                center:{
                    userAccess:{
                        some:{
                            userId:actor.userId,
                        },
                    },
                },
            };

        case UserRole.EMPLOYEE:
        case UserRole.TECHNICIAN:
            default:
                throw new AppError(
                    "FORBIDDEN",
                    "You are not allowed to manage ticket assignments.",
                );
    }
}