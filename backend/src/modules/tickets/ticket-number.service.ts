import type { Prisma } from "../../generated/prisma/client";

export async function reserveTicketNumber(
    tx: Prisma.TransactionClient,
    year: number,
): Promise<string> {
    const prefix = `GST-${year}-`;

    /*
     * Ensure the yearly counter row exists.
     *
     * For an existing row, incrementing by 0 intentionally leaves
     * the value unchanged while causing the database to touch the row.
     *
     * This happens inside the transaction, so subsequent operations
     * use the same transaction context.
     */
    await tx.ticketNumberCounter.upsert({
        where: {
            year,
        },

        create: {
            year,
            sequence: 0,
        },

        update: {
            sequence: {
                increment: 0,
            },
        },
    });

    /*
     * Increment the counter first.
     *
     * This is the normal fast path.
     *
     * Example:
     *
     * counter = 16
     *        ↓
     * counter = 17
     */
    const incrementedCounter =
        await tx.ticketNumberCounter.update({
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

    let sequence = incrementedCounter.sequence;

    /*
     * Check the highest ticket number already stored for this year.
     *
     * Ticket numbers have a fixed-width numeric suffix:
     *
     * GST-2026-000001
     * GST-2026-000002
     * ...
     *
     * Therefore descending lexical order gives the highest
     * existing sequence.
     */
    const latestTicket = await tx.ticket.findFirst({
        where: {
            ticketNumber: {
                startsWith: prefix,
            },
        },

        orderBy: {
            ticketNumber: "desc",
        },

        select: {
            ticketNumber: true,
        },
    });

    if (latestTicket) {
        const sequencePart =
            latestTicket.ticketNumber.slice(prefix.length);

        const existingMaxSequence =
            Number.parseInt(sequencePart, 10);

        if (
            Number.isInteger(existingMaxSequence) &&
            existingMaxSequence >= sequence
        ) {
            /*
             * Counter drift detected.
             *
             * Example:
             *
             * Counter after increment = 16
             * Existing highest ticket = 16
             *
             * We must move the counter to 17.
             */
            sequence = existingMaxSequence + 1;

            await tx.ticketNumberCounter.update({
                where: {
                    year,
                },

                data: {
                    sequence,
                },
            });
        }
    }

    const formattedSequence = String(sequence).padStart(
        6,
        "0",
    );

    return `${prefix}${formattedSequence}`;
}