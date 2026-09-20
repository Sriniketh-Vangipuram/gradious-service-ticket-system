import type { Prisma } from "../../../generated/prisma/client";
import type { ListTicketsQuery } from "../ticket.schemas";

export function buildTicketListFilters(
  query: ListTicketsQuery,
): Prisma.TicketWhereInput {
  const filters: Prisma.TicketWhereInput[] = [];

  if (query.status) {
    filters.push({ status: query.status });
  }

  if (query.priority) {
    filters.push({ priority: query.priority });
  }

  if (query.categoryId !== undefined) {
    filters.push({ categoryId: query.categoryId });
  }

  if (query.centerId !== undefined) {
    filters.push({ centerId: query.centerId });
  }

  if (query.labId !== undefined) {
    filters.push({ labId: query.labId });
  }

  if (query.search) {
    filters.push({
      OR: [
        {
          ticketNumber: {
            contains: query.search,
          },
        },
        {
          title: {
            contains: query.search,
          },
        },
      ],
    });
  }

  return filters.length > 0
    ? { AND: filters }
    : {};
}