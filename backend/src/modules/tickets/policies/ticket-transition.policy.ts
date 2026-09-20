import { TicketStatus } from "../../../generated/prisma/client";
import { AppError } from "../../../common/errors/app-error";

const allowedTransitions: Record<TicketStatus, readonly TicketStatus[]>={
    OPEN:["TRIAGED","CANCELLED"],
    TRIAGED:["ASSIGNED","CANCELLED"],
    ASSIGNED:["IN_PROGRESS","CANCELLED"],
    IN_PROGRESS:["WAITING_FOR_USER","RESOLVED","CANCELLED"],
    WAITING_FOR_USER:["IN_PROGRESS","CANCELLED"],
    RESOLVED:["CLOSED","IN_PROGRESS"],
    CLOSED:["IN_PROGRESS"],
    CANCELLED:[],
};

export function assertValidTicketTransition(
    currentStatus: TicketStatus,
    nextStatus: TicketStatus,
):void{

    const allowed = allowedTransitions[currentStatus];

    if(!allowed.includes(nextStatus)){
        throw new AppError(
            "CONFLICT",
            `Ticket cannot transition from ${currentStatus} to ${nextStatus}.`,
        );
    }
}