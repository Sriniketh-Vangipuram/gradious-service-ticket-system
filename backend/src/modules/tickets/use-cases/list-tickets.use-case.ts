import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../../config/database";
import { AppError } from "../../../common/errors/app-error";

import type { ListTicketsQuery } from "../ticket.schemas";
import type { TicketListActor } from "../policies/ticket-list-scope.policy";

import { buildTicketListScope } from "../policies/ticket-list-scope.policy";
import { buildTicketListFilters } from "../policies/ticket-list-filters.policy";
import { validateTicketListLocation } from "../policies/validate-ticket-list-location.policy";
import { decodeCursor, encodeCursor } from "../../../common/pagination/cursor.codec";

export async function listTicketsUseCase(
  query: ListTicketsQuery,
  actor: TicketListActor,
) {
  const roleScope = buildTicketListScope(actor);

  await validateTicketListLocation(query);

  const filters = buildTicketListFilters(query);

  let cursorCondition: Prisma.TicketWhereInput = {};

  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);

    if (cursor.sort !== query.sort) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Cursor does not match the requested sort order.",
        [
          {
            field: "query.cursor",
            message: "Use a cursor generated for the selected sort order.",
          },
        ],
      );
    }

    const cursorDate = new Date(cursor.createdAt);
    const isNewest = query.sort === "newest";

    cursorCondition = {
      OR: [
        {
          createdAt: isNewest ? { lt: cursorDate } : { gt: cursorDate },
        },
        {
          createdAt: cursorDate,
          id: isNewest ? { lt: cursor.id } : { gt: cursor.id },
        },
      ],
    };
  }

  const where: Prisma.TicketWhereInput = {
    AND: [
      roleScope,
      filters,
      cursorCondition,
    ],
  };

  const orderBy: Prisma.TicketOrderByWithRelationInput[] =
    query.sort === "newest"
      ? [{ createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "asc" }, { id: "asc" }];

  const rows = await prisma.ticket.findMany({
    where,
    orderBy,
    take: query.limit + 1,
    include: {
      requester: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      center: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      lab: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      category: true,
      software: true,
    },
  });

  const hasNextPage = rows.length > query.limit;
  const items = hasNextPage ? rows.slice(0, query.limit) : rows;

  const lastItem = items.at(-1);

  const nextCursor =
    hasNextPage && lastItem
      ? encodeCursor({
          v: 1,
          createdAt: lastItem.createdAt.toISOString(),
          id: lastItem.id,
          sort: query.sort,
        })
      : null;

  return {
    items,
    pagination: {
      nextCursor,
      hasNextPage,
    },
  };
}