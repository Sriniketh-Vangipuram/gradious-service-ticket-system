export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="flex flex-col items-center text-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400"
          aria-hidden="true"
        />

        <p className="mt-4 text-sm font-medium text-slate-300">
          Restoring your session
        </p>

        <p className="mt-1 text-xs text-slate-500">
          Please wait while we securely verify your account.
        </p>
      </div>
    </div>
  );
}