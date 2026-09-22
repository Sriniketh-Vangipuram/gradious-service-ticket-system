import { Outlet } from "react-router-dom";

import { UserMenu } from "../../components/navigation/UserMenu";

export function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              Gradious Service Desk
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              IT Service Management
            </p>
          </div>

          <UserMenu />
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}