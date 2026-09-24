import {
  Activity,
  Bell,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  ListTodo,
  MonitorCog,
  PlusCircle,
  ScrollText,
  Settings2,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "../../constants/routes";

import type { UserRole } from "../../features/auth/types/auth.types";

export type NavigationSection =
  | "WORKSPACE"
  | "MANAGEMENT"
  | "SERVICE CATALOG"
  | "OPERATIONS"
  | "SYSTEM";

export interface NavigationItem {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
  section: NavigationSection;
}

export const navigationItems: NavigationItem[] = [
  /* ---------------------------------------------------------------------- */
  /* Employee / General Workspace                                           */
  /* ---------------------------------------------------------------------- */

  {
    label: "Dashboard",
    description: "Overview",
    to: ROUTES.app.dashboard,
    icon: LayoutDashboard,
    roles: ["EMPLOYEE"],
    section: "WORKSPACE",
  },

  {
    label: "My Tickets",
    description: "Track your requests",
    to: ROUTES.app.tickets,
    icon: Ticket,
    roles: ["EMPLOYEE"],
    section: "WORKSPACE",
  },

  {
    label: "Create Ticket",
    description: "Submit a new request",
    to: ROUTES.app.createTicket,
    icon: PlusCircle,
    roles: ["EMPLOYEE"],
    section: "WORKSPACE",
  },

  /* ---------------------------------------------------------------------- */
  /* Technician Workspace                                                    */
  /* ---------------------------------------------------------------------- */

  {
    label: "Technician Dashboard",
    description: "Support workload overview",
    to: ROUTES.technician.dashboard,
    icon: ListTodo,
    roles: ["TECHNICIAN"],
    section: "WORKSPACE",
  },

  {
    label: "Ticket Queue",
    description: "Manage service requests",
    to: ROUTES.technician.queue,
    icon: ClipboardList,
    roles: ["TECHNICIAN"],
    section: "WORKSPACE",
  },

  /* ---------------------------------------------------------------------- */
  /* Manager / Admin Workspace                                               */
  /* ---------------------------------------------------------------------- */

  {
    label: "Administration",
    description: "Management overview",
    to: ROUTES.administration.dashboard,
    icon: Settings2,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "WORKSPACE",
  },

  /* ---------------------------------------------------------------------- */
  /* Management                                                              */
  /* ---------------------------------------------------------------------- */

  {
    label: "Tickets",
    description: "Service ticket operations",
    to: ROUTES.administration.tickets,
    icon: Ticket,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "MANAGEMENT",
  },

  {
    label: "Users",
    description: "Manage users and technicians",
    to: ROUTES.administration.users,
    icon: Users,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "MANAGEMENT",
  },

  {
    label: "Centers",
    description: "Manage service centers",
    to: ROUTES.administration.centers,
    icon: Building2,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "MANAGEMENT",
  },

  {
    label: "Labs",
    description: "Manage labs and assignments",
    to: ROUTES.administration.labs,
    icon: MonitorCog,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "MANAGEMENT",
  },

  /* ---------------------------------------------------------------------- */
  /* Service Catalog                                                         */
  /* ---------------------------------------------------------------------- */

  {
    label: "Software",
    description: "Manage software catalog",
    to: ROUTES.administration.software,
    icon: MonitorCog,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "SERVICE CATALOG",
  },

  {
    label: "Categories",
    description: "Manage service categories",
    to: ROUTES.administration.categories,
    icon: FolderTree,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "SERVICE CATALOG",
  },

  /* ---------------------------------------------------------------------- */
  /* Operations                                                              */
  /* ---------------------------------------------------------------------- */

  {
    label: "SLA Monitoring",
    description: "Monitor service performance",
    to: ROUTES.administration.sla,
    icon: Activity,
    roles: ["CENTER_MANAGER", "ADMIN"],
    section: "OPERATIONS",
  },

  /* ---------------------------------------------------------------------- */
  /* System                                                                  */
  /* ---------------------------------------------------------------------- */

  {
    label: "Audit Logs",
    description: "Review system activity",
    to: ROUTES.administration.auditLogs,
    icon: ScrollText,
    roles: ["ADMIN"],
    section: "SYSTEM",
  },

  {
    label: "Analytics",
    description: "Service performance insights",
    to: ROUTES.administration.analytics,
    icon: ChartNoAxesCombined,
    roles: ["ADMIN"],
    section: "SYSTEM",
  },

  /* ---------------------------------------------------------------------- */
  /* Notifications                                                           */
  /* ---------------------------------------------------------------------- */

  {
    label: "Notifications",
    description: "Updates and alerts",
    to: ROUTES.app.notifications,
    icon: Bell,
    roles: [
      "EMPLOYEE",
      "TECHNICIAN",
      "CENTER_MANAGER",
      "ADMIN",
    ],
    section: "WORKSPACE",
  },
];