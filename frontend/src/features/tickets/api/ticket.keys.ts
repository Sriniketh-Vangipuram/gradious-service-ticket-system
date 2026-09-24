export const TICKET_QUERY_KEYS = {
  all: ["tickets"] as const,

  lists: () => [...TICKET_QUERY_KEYS.all, "list"] as const,

  list: (params?: unknown) =>
    [...TICKET_QUERY_KEYS.lists(), params] as const,

  details: () => [...TICKET_QUERY_KEYS.all, "detail"] as const,

  detail: (ticketId: number) =>
    [...TICKET_QUERY_KEYS.details(), ticketId] as const,

  eligibleTechnicians: (ticketId: number) =>
  [...TICKET_QUERY_KEYS.detail(ticketId), "eligible-technicians"] as const,
};