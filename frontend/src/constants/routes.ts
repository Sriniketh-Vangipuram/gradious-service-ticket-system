export const ROUTES = {
  login: "/login",
  register:"/register",

  app: {
    dashboard: "/dashboard",
    tickets: "/tickets",
    createTicket:"/tickets/new",
    ticket: (ticketId: number | string) => `/tickets/${ticketId}`,
    notifications: "/notifications",
  },

  technician: {
    dashboard: "/technician/dashboard",
    queue: "/technician/queue",
  },

  administration: {
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