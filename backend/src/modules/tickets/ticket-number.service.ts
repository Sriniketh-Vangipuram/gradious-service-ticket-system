import type { Prisma } from "../../generated/prisma/client";

export async function reserveTicketNumber(
    tx:Prisma.TransactionClient,
    year:number,
):Promise<string> {
    const counter = await tx.ticketNumberCounter.upsert({
        where: {year},
        create: {
            year,
            sequence: 1,
        },

        update: {
            sequence: {
                increment: 1,
            },
        },

        select:{
            sequence:true,
        },
    });

    const formattedSequence = String(counter.sequence).padStart(6,"0");

    return `GST-${year}-${formattedSequence}`;
}