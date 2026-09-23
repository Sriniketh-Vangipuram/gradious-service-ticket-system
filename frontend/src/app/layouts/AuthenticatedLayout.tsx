import { Outlet } from "react-router-dom";

import { AppSidebar } from "../../components/navigation/AppSidebar";
import { UserMenu } from "../../components/navigation/UserMenu";
import { MobileNavigation } from "../../components/navigation/MobileNavigation";
import { useSocketConnection } from "../../lib/socket/useSocketConnection";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import { useNotificationSocket } from "../../features/notifications/hooks/useNotificationSocket";


export function AuthenticatedLayout() {
  const { data: currentUser } = useCurrentUser();

  const socketEnabled = Boolean(currentUser);

  useSocketConnection({
    enabled: socketEnabled,
  });

  useNotificationSocket(socketEnabled);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNavigation />

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20">
              <span
                className="text-sm font-bold text-indigo-300"
                aria-hidden="true"
              >
                G
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                Gradious Service Desk
              </p>

              <p className="hidden text-xs text-slate-500 sm:block">
                IT Service Management
              </p>
            </div>
          </div>

          <UserMenu />
        </div>
      </header>

      <div className="flex">
        <AppSidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}