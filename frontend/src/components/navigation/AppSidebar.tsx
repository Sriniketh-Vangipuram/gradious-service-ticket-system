import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useMemo } from "react";

import { navigationItems } from "./navigation-config";
import { ROUTES } from "../../constants/routes";

export function AppSidebar() {

  const location = useLocation();
  
  const { user } = useAuth();

  const visibleNavigationItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigationItems.filter((item) =>
      item.roles.includes(user.role),
    );
  }, [user]);

  const isNavigationItemActive = (itemTo: string) => {
    if (itemTo === ROUTES.app.tickets) {
      return (
        location.pathname === ROUTES.app.tickets ||
        (location.pathname.startsWith(`${ROUTES.app.tickets}/`) &&
          location.pathname !== ROUTES.app.createTicket)
      );
    }

    return location.pathname === itemTo;
  };

  return (
    <aside
      aria-label="Application navigation"
      className="hidden w-64 shrink-0 border-r border-slate-800/80 bg-slate-950 lg:block"
    >
      <div className="sticky top-0 flex h-[calc(100vh-4rem)] flex-col">
        <div className="border-b border-slate-800/60 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
            Workspace
          </p>

          <h2 className="mt-2 text-base font-semibold text-white">
            Employee Portal
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Manage your IT service requests and support activity.
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavigationItemActive(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-3 transition",
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

                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {item.label}
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
        </nav>

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
