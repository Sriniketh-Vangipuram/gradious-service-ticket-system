import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  ListTodo,
  Ticket,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "../../constants/routes";
import type { UserRole } from "../../features/auth/types/auth.types";

export interface NavigationItem {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    description: "Overview",
    to: ROUTES.app.dashboard,
    icon: LayoutDashboard,
    roles: ["EMPLOYEE"],
  },
  {
    label: "My Tickets",
    description: "Track your requests",
    to: ROUTES.app.tickets,
    icon: Ticket,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Create Ticket",
    description: "Submit a new request",
    to: ROUTES.app.createTicket,
    icon: PlusCircle,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Technician Dashboard",
    description: "Support workload overview",
    to: ROUTES.technician.dashboard,
    icon: ListTodo,
    roles: ["TECHNICIAN"],
  },
  {
    label: "Ticket Queue",
    description: "Manage service requests",
    to: ROUTES.technician.queue,
    icon: ClipboardList,
    roles: ["TECHNICIAN"],
  },
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
  },
];