import { Navigate } from "react-router-dom";
import type { PropsWithChildren } from "react";

import { ROUTES } from "../../constants/routes";
import { AuthLoadingScreen } from "../../components/feedback/AuthLoadingScreen";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import type { UserRole } from "../../features/auth/types/auth.types";

interface ProtectedRouteProps extends PropsWithChildren {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const {
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    error,
    user,
  } = useCurrentUser();

  // Session is still being restored.
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  // The session is genuinely unauthenticated.
  if (isUnauthenticated) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
      />
    );
  }

  // A user exists and the session is valid.
  if (isAuthenticated) {
    if (
      allowedRoles &&
      (!user || !allowedRoles.includes(user.role))
    ) {
      return (
        <Navigate
          to={ROUTES.app.dashboard}
          replace
        />
      );
    }

    return children;
  }

  // Authentication could not be determined because
  // something other than authentication failed.
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          !
        </div>

        <h1 className="mt-5 text-lg font-semibold text-white">
          We couldn't restore your session
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {error?.message ??
            "Something went wrong while verifying your session."}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Try again
        </button>
      </div>
    </div>
  );
}