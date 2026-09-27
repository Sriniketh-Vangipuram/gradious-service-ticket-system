import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

export function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link
            to={ROUTES.home}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold shadow-lg shadow-blue-600/20">
              G
            </div>

            <div>
              <p className="text-lg font-semibold tracking-tight">
                Gradious
              </p>
              <p className="text-xs text-slate-500">
                Service Ticket System
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.login}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
            >
              Login
            </Link>

            <Link
              to={ROUTES.register}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_35%)]" />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300">
                IT Service Management Platform
              </div>

              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Manage IT service requests
                <span className="block text-blue-500">
                  from request to resolution.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
                Gradious Service Ticket System gives employees,
                technicians, center managers, and administrators a
                centralized platform to create, track, assign, and
                resolve IT service requests across centers and labs.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={ROUTES.register}
                  className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                >
                  Get started
                </Link>

                <Link
                  to={ROUTES.login}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="mt-20 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
              <div className="border-b border-slate-800 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-700" />
                  <span className="h-3 w-3 rounded-full bg-slate-700" />
                  <span className="h-3 w-3 rounded-full bg-slate-700" />
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    Open Tickets
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    128
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Across all centers
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    In Progress
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    47
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Currently assigned
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    Resolved
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    342
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    This month
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-slate-500">
                    SLA Compliance
                  </p>
                  <p className="mt-2 text-3xl font-bold">
                    94%
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Current performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-slate-800 bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
                Built for service operations
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Everything needed to manage support requests
              </h2>

              <p className="mt-4 text-slate-400">
                A centralized workflow for employees and IT teams,
                backed by role-based access, SLA monitoring,
                notifications, and operational analytics.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                title="Ticket Management"
                description="Create, track, assign, update, and resolve IT service requests through a structured workflow."
              />

              <FeatureCard
                title="SLA Monitoring"
                description="Monitor first-response and resolution deadlines with at-risk and breached SLA alerts."
              />

              <FeatureCard
                title="Role-Based Access"
                description="Separate experiences for employees, technicians, center managers, and administrators."
              />

              <FeatureCard
                title="Analytics"
                description="Understand ticket volume, workload, resolution performance, and SLA compliance."
              />
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
                Simple workflow
              </p>

              <h2 className="mt-3 text-3xl font-bold">
                From request to resolution
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Every request follows a structured lifecycle so
                teams can maintain visibility and accountability.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              <WorkflowStep
                number="01"
                title="Create"
                description="An employee submits an IT service request."
              />

              <WorkflowStep
                number="02"
                title="Assign"
                description="The request is triaged and assigned to the appropriate technician."
              />

              <WorkflowStep
                number="03"
                title="Resolve"
                description="The technician investigates and resolves the issue."
              />

              <WorkflowStep
                number="04"
                title="Close"
                description="The requester confirms resolution and the ticket is completed."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-800 bg-slate-900/40">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to manage your service requests?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Create an account to submit and track IT service
              requests, or sign in to continue working with your
              existing tickets.
            </p>

            <div className="mt-8 flex justify-center gap-4">
              <Link
                to={ROUTES.register}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
              >
                Create account
              </Link>

              <Link
                to={ROUTES.login}
                className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Gradious Service Ticket
            System
          </p>

          <p>
            IT service management platform
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:border-slate-700">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
        ✓
      </div>

      <h3 className="text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <p className="text-sm font-bold text-blue-500">
        {number}
      </p>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}