import type { Prisma } from "../../generated/prisma/client";

export async function reserveTicketNumber(
    tx: Prisma.TransactionClient,
    year: number,
): Promise<string> {
    /*
     * Ensure the yearly counter exists.
     *
     * The counter is the source of truth for generating
     * the next ticket number.
     */
    await tx.ticketNumberCounter.upsert({
        where: {
            year,
        },

        create: {
            year,
            sequence: 0,
        },

        update: {},
    });

    /*
     * Atomically increment the yearly sequence.
     *
     * Example:
     *
     * sequence = 17
     *      ↓
     * sequence = 18
     */
    const counter = await tx.ticketNumberCounter.update({
        where: {
            year,
        },

        data: {
            sequence: {
                increment: 1,
            },
        },

        select: {
            sequence: true,
        },
    });

    const formattedSequence = String(counter.sequence).padStart(
        6,
        "0",
    );

    return `GST-${year}-${formattedSequence}`;
}