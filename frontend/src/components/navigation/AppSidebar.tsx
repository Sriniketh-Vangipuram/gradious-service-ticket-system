import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useUnreadNotificationCount } from "../../features/notifications/hooks/useUnreadNotificationCount";
import {
  navigationItems,
  type NavigationSection,
} from "./navigation-config";

const SECTION_ORDER: NavigationSection[] = [
  "WORKSPACE",
  "MANAGEMENT",
  "SERVICE CATALOG",
  "OPERATIONS",
  "SYSTEM",
];

const ROLE_TITLES = {
  EMPLOYEE: {
    title: "Employee Portal",
    description:
      "Manage your IT service requests and support activity.",
  },

  TECHNICIAN: {
    title: "Technician Workspace",
    description:
      "Manage assigned service requests and support operations.",
  },

  CENTER_MANAGER: {
    title: "Service Management",
    description:
      "Manage service operations across your assigned centers.",
  },

  ADMIN: {
    title: "Administration",
    description:
      "Manage service operations, users, and system activity.",
  },
} as const;

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const { unreadCount } = useUnreadNotificationCount();

  const visibleNavigationItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigationItems.filter((item) =>
      item.roles.includes(user.role),
    );
  }, [user]);

  const navigationSections = useMemo(() => {
    return SECTION_ORDER.map((section) => ({
      section,
      items: visibleNavigationItems.filter(
        (item) => item.section === section,
      ),
    })).filter((group) => group.items.length > 0);
  }, [visibleNavigationItems]);

  const isNavigationItemActive = (itemTo: string) => {
    if (itemTo === ROUTES.app.tickets) {
      return (
        location.pathname === ROUTES.app.tickets ||
        (location.pathname.startsWith(
          `${ROUTES.app.tickets}/`,
        ) &&
          location.pathname !== ROUTES.app.createTicket)
      );
    }

    if (itemTo === ROUTES.administration.dashboard) {
      return (
        location.pathname ===
          ROUTES.administration.dashboard ||
        location.pathname.startsWith(
          `${ROUTES.administration.dashboard}/`,
        )
      );
    }

    return location.pathname === itemTo;
  };

  if (!user) {
    return null;
  }

  const roleContent = ROLE_TITLES[user.role];

  return (
    <aside
      aria-label="Application navigation"
      className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-950 lg:block"
    >
      <div className="sticky top-0 flex h-[calc(100vh-4rem)] flex-col">
        {/* ---------------------------------------------------------------- */}
        {/* Workspace identity                                               */}
        {/* ---------------------------------------------------------------- */}

        <div className="border-b border-slate-800/60 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            {user.role === "ADMIN"
              ? "System"
              : user.role === "CENTER_MANAGER"
                ? "Management"
                : "Workspace"}
          </p>

          <h2 className="mt-2 text-base font-semibold text-white">
            {roleContent.title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {roleContent.description}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Navigation                                                       */}
        {/* ---------------------------------------------------------------- */}

        <nav
          aria-label="Primary navigation"
          className="flex-1 overflow-y-auto px-3 py-5"
        >
          <div className="space-y-6">
            {navigationSections.map(
              ({ section, items }) => (
                <div key={section}>
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {section}
                  </p>

                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        isNavigationItemActive(
                          item.to,
                        );

                      const isNotificationsItem =
                        item.to ===
                        ROUTES.app.notifications;

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={[
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                            "focus:outline-none focus:ring-2 focus:ring-indigo-400/70",
                            isActive
                              ? "bg-indigo-500/10 text-white ring-1 ring-inset ring-indigo-500/20"
                              : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition",
                              isActive
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "bg-slate-900 text-slate-500 group-hover:text-slate-300",
                            ].join(" ")}
                          >
                            <Icon
                              size={17}
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="block truncate text-sm font-medium">
                                {item.label}
                              </span>

                              {isNotificationsItem &&
                              unreadCount > 0 ? (
                                <span
                                  aria-label={`${unreadCount} unread notifications`}
                                  className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-indigo-300"
                                >
                                  {unreadCount > 99
                                    ? "99+"
                                    : unreadCount}
                                </span>
                              ) : null}
                            </span>

                            <span
                              className={[
                                "mt-0.5 block truncate text-xs",
                                isActive
                                  ? "text-slate-400"
                                  : "text-slate-600 group-hover:text-slate-500",
                              ].join(" ")}
                            >
                              {item.description}
                            </span>
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        </nav>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="border-t border-slate-800/60 px-5 py-4">
          <p className="text-[11px] leading-5 text-slate-600">
            Gradious Service Desk
          </p>

          <p className="text-[11px] text-slate-700">
            Internal IT Service Management
          </p>
        </div>
      </div>
    </aside>
  );
}