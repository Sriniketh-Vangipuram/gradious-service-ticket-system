export const ANALYTICS_QUERY_KEYS = {
  all: ["analytics"] as const,

  overview: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "overview",
  ] as const,

  overviewWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.overview(),
    params,
  ] as const,

  ticketVolume: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "ticket-volume",
  ] as const,

  ticketVolumeWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.ticketVolume(),
    params,
  ] as const,

  ticketTrends: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "ticket-trends",
  ] as const,

  ticketTrendsWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.ticketTrends(),
    params,
  ] as const,

  byCenter: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "by-center",
  ] as const,

  byCenterWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.byCenter(),
    params,
  ] as const,

  byCategory: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "by-category",
  ] as const,

  byCategoryWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.byCategory(),
    params,
  ] as const,

  byPriority: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "by-priority",
  ] as const,

  byPriorityWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.byPriority(),
    params,
  ] as const,

  slaCompliance: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "sla-compliance",
  ] as const,

  slaComplianceWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.slaCompliance(),
    params,
  ] as const,

  responseTime: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "response-time",
  ] as const,

  responseTimeWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.responseTime(),
    params,
  ] as const,

  resolutionTime: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "resolution-time",
  ] as const,

  resolutionTimeWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.resolutionTime(),
    params,
  ] as const,

  technicianWorkload: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "technician-workload",
  ] as const,

  technicianWorkloadWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.technicianWorkload(),
    params,
  ] as const,

  resolutionRate: () => [
    ...ANALYTICS_QUERY_KEYS.all,
    "resolution-rate",
  ] as const,

  resolutionRateWithFilters: (params?: unknown) => [
    ...ANALYTICS_QUERY_KEYS.resolutionRate(),
    params,
  ] as const,
};