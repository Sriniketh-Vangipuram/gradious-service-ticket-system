export const ROUTES = {
  login: "/login",
  register:"/register",

  app: {
    dashboard: "/dashboard",
    tickets: "/tickets",
    ticket: (ticketId: number | string) => `/tickets/${ticketId}`,
    notifications: "/notifications",
  },

  technician: {
    dashboard: "/technician/dashboard",
    queue: "/technician/queue",
  },

  management: {
    dashboard: "/management/dashboard",
    users: "/management/users",
    centers: "/management/centers",
    labs: "/management/labs",
    software: "/management/software",
    categories: "/management/categories",
    tickets: "/management/tickets",
    sla: "/management/sla",
    auditLogs: "/management/audit-logs",
    analytics: "/management/analytics",
  },
} as const;