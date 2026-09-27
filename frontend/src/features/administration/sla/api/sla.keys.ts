export const SLA_QUERY_KEYS = {
  all: ["sla"] as const,

  overview: () => [
    ...SLA_QUERY_KEYS.all,
    "overview",
  ] as const,

  overviewWithFilters: (params?: unknown) => [
    ...SLA_QUERY_KEYS.overview(),
    params,
  ] as const,

  tickets: () => [
    ...SLA_QUERY_KEYS.all,
    "tickets",
  ] as const,

  ticketList: (params?: unknown) => [
    ...SLA_QUERY_KEYS.tickets(),
    params,
  ] as const,

  policies: () => [
    ...SLA_QUERY_KEYS.all,
    "policies",
  ] as const,

  policy: (priority: string) => [
    ...SLA_QUERY_KEYS.policies(),
    priority,
  ] as const,
};