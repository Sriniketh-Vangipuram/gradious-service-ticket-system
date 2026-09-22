import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useMemo, useState } from "react";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { navigationItems } from "./navigation-config";

export function MobileNavigation() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const visibleNavigationItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigationItems.filter((item) =>
      item.roles.includes(user.role),
    );
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation"
        aria-expanded={isOpen}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70 lg:hidden"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside className="relative z-[101] flex h-dvh w-80 max-w-[85vw] flex-col overflow-hidden border-r border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
              <div>
                <p className="text-sm font-semibold text-white">
                  Gradious Service Desk
                </p>

                <p className="text-xs text-slate-500">
                  Employee Portal
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <nav
              aria-label="Mobile application navigation"
              className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
            >
              {visibleNavigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-xl px-3 py-3 transition",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-400/70",
                        isActive
                          ? "bg-indigo-500/10 text-white ring-1 ring-inset ring-indigo-500/20"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
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
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}