import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
      navigate(ROUTES.login, { replace: true });
    } catch {
      // The auth cache is cleared in useAuth's finally block.
      // Navigation still takes the user out of the protected area.
      navigate(ROUTES.login, { replace: true });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-200">
          {user.fullName}
        </p>

        <p className="text-xs text-slate-500">
          {user.role.replaceAll("_", " ")}
        </p>
      </div>

      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300">
        <User
          size={17}
          aria-hidden="true"
        />
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut
          size={16}
          aria-hidden="true"
        />

        {isLoggingOut
          ? "Signing out..."
          : "Sign out"}
      </button>
    </div>
  );
}