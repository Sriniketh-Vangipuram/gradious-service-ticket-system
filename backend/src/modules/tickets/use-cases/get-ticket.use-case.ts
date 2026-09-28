import { UserRole } from "../../../generated/prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";
import {
  getTicketCancellationInfo,
} from "./get-ticket-cancellation-info";

type TicketActor = {
    userId:number;
    role:UserRole;
};

export async function getTicketUseCase(
    ticketId:number,
    actor: TicketActor,
){
    let where : {
        id: number;
        requesterId?:number;
        assigneeId?:number;
        center?:{
            userAccess:{
                some:{
                    userId:number;
                };
            };
        };
    };

    switch(actor.role){
        case UserRole.ADMIN:
            where = {id: ticketId};
            break;

        case UserRole.EMPLOYEE:
            where = {
                id: ticketId,
                requesterId:actor.userId,
            };
            break;

        case UserRole.TECHNICIAN:
            where = {
                id:ticketId,
                assigneeId:actor.userId,
            };
            break;
            
        case UserRole.CENTER_MANAGER:
            where={
                id:ticketId,
                center:{
                    userAccess:{
                        some:{
                            userId:actor.userId,
                        },
                    },
                },
            };
            break;

        default:
            throw new AppError("FORBIDDEN","You are not allowed to view this ticket.");

    }


    const ticket = await prisma.ticket.findFirst({
        where,
        include:{
            requester:{
                select:{
                    id:true,
                    fullName:true,
                    email:true,
                },
            },

            centerManager: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },

            assignee:{
                select:{
                    id:true,
                    fullName:true,
                    email:true,
                },
            },

            center:{
                select:{
                    id:true,
                    name:true,
                    code:true,
                },
            },

            lab:{
                select:{
                    id:true,
                    name:true,
                    code:true,
                },
            },

            category:true,
            software:true,
        },
    });

    if(!ticket){
        throw new AppError("NOT_FOUND","Ticket not found.");
    }

    const cancellationInfo =
    await getTicketCancellationInfo(
        prisma,
        ticket.id,
        actor,
    );

    return {
    ...ticket,
    ...cancellationInfo,
    };

}