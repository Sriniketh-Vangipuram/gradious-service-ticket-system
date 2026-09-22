import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { ROUTES } from "../../../constants/routes";
import { useAuth } from "../hooks/useAuth";
import { useRegister } from "../hooks/useRegister";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register.schemas";

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    user,
    isLoading: isSessionLoading,
  } = useAuth();

  const registerMutation = useRegister();

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (isSessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-400">
          Restoring your session...
        </p>
      </div>
    );
  }

  if (user) {
    return (
      <Navigate
        to={ROUTES.app.dashboard}
        replace
      />
    );
  }

  const onSubmit = async (
    values: RegisterFormValues,
  ) => {
    try {
      const { confirmPassword, ...payload } = values;

      void confirmPassword;

      await registerMutation.mutateAsync(payload);

      navigate(ROUTES.app.dashboard, {
        replace: true,
      });
    } catch {
      // The normalized error is rendered below.
    }
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-12 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-black/20 lg:grid-cols-2">

          {/* Product panel */}

          <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950 p-12 lg:flex lg:flex-col lg:justify-between">
            <div
              className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                  <ShieldCheck
                    className="h-5 w-5 text-white"
                    aria-hidden="true"
                  />
                </div>

                <span className="text-sm font-semibold tracking-wide text-white">
                  Gradious Service Desk
                </span>
              </div>

              <div className="mt-20 max-w-lg">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-200">
                  Get started
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
                  Your service workspace starts here.
                </h1>

                <p className="mt-5 text-base leading-7 text-indigo-100">
                  Create your employee account to submit software
                  requests, track service tickets, and communicate
                  with your support team.
                </p>
              </div>
            </div>

            <div className="relative grid grid-cols-3 gap-4">
              {[
                ["Requests", "Centralized"],
                ["Support", "Connected"],
                ["Access", "Secure"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <p className="text-xs text-indigo-200">
                    {label}
                  </p>

                  <p className="mt-1 text-sm font-medium text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Registration form */}

          <section className="flex items-center bg-slate-950/40 p-8 sm:p-12">
            <div className="mx-auto w-full max-w-md">
              <div>
                <p className="text-sm font-medium text-indigo-400">
                  Employee registration
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  Create your account
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Set up your account to access the Gradious Service
                  Desk.
                </p>
              </div>

              {registerMutation.error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {registerMutation.error.message}
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-5"
                noValidate
              >
                {/* Full name */}

                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Full name
                  </label>

                  <div className="relative mt-2">
                    <UserRound
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />

                    <input
                      id="fullName"
                      type="text"
                      autoComplete="name"
                      {...register("fullName")}
                      aria-invalid={Boolean(
                        errors.fullName,
                      )}
                      aria-describedby={
                        errors.fullName
                          ? "fullName-error"
                          : undefined
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Your full name"
                    />
                  </div>

                  {errors.fullName && (
                    <p
                      id="fullName-error"
                      className="mt-2 text-xs text-red-400"
                    >
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email */}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Email address
                  </label>

                  <div className="relative mt-2">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />

                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register("email")}
                      aria-invalid={Boolean(
                        errors.email,
                      )}
                      aria-describedby={
                        errors.email
                          ? "email-error"
                          : undefined
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="you@company.com"
                    />
                  </div>

                  {errors.email && (
                    <p
                      id="email-error"
                      className="mt-2 text-xs text-red-400"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Password
                  </label>

                  <div className="relative mt-2">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      {...register("password")}
                      aria-invalid={Boolean(
                        errors.password,
                      )}
                      aria-describedby={
                        errors.password
                          ? "password-error"
                          : undefined
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Create a password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>

                  {errors.password && (
                    <p
                      id="password-error"
                      className="mt-2 text-xs text-red-400"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Confirm password */}

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-200"
                  >
                    Confirm password
                  </label>

                  <div className="relative mt-2">
                    <LockKeyhole
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden="true"
                    />

                    <input
                      id="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                      aria-invalid={Boolean(
                        errors.confirmPassword,
                      )}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-10 py-3 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Confirm your password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current,
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-2 text-xs text-red-400"
                    >
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    registerMutation.isPending
                  }
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {registerMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to={ROUTES.login}
                    className="font-medium text-indigo-400 transition hover:text-indigo-300"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-6">
                <p className="text-center text-xs leading-5 text-slate-500">
                  Registration creates a standard employee account.
                  Your session is secured using HTTP-only
                  authentication cookies.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}