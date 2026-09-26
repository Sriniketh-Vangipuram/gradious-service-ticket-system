import {
  BarChart3,
  Building2,
  ClipboardList,
  Clock3,
  FileSearch,
  Layers3,
  Package,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../../constants/routes";


const administrationAreas = [
  {
    title: "Ticket Operations",
    description:
      "Oversee service requests, assignments, lifecycle activity, and operational workload.",
    icon: ClipboardList,
    iconClassName: "bg-indigo-500/10 text-indigo-300",
    to: ROUTES.administration.tickets,
  },

  {
    title: "SLA Monitoring",
    description:
      "Monitor service-level commitments, approaching deadlines, and breached targets.",
    icon: Clock3,
    iconClassName: "bg-amber-500/10 text-amber-300",
  },
  {
    title: "Service Health",
    description:
      "Understand operational workload, service activity, and overall support performance.",
    icon: BarChart3,
    iconClassName: "bg-emerald-500/10 text-emerald-300",
  },
  {
    title: "Centers",
    description:
      "Manage service centers and the organizational structure supporting service delivery.",
    icon: Building2,
    iconClassName: "bg-sky-500/10 text-sky-300",
    to:ROUTES.administration.centers,
  },
  {
    title: "Labs",
    description:
      "Manage labs, their center relationships, and service locations.",
    icon: Layers3,
    iconClassName: "bg-violet-500/10 text-violet-300",
  },
  {
    title: "Users",
    description:
      "Manage employees, technicians, managers, and administrative access.",
    icon: Users,
    iconClassName: "bg-cyan-500/10 text-cyan-300",
    to: ROUTES.administration.users,
  },
  {
    title: "Software Catalog",
    description:
      "Maintain the software catalog used across installation and support requests.",
    icon: Package,
    iconClassName: "bg-fuchsia-500/10 text-fuchsia-300",
  },
  {
    title: "Categories",
    description:
      "Maintain service categories used to classify and organize tickets.",
    icon: Layers3,
    iconClassName: "bg-orange-500/10 text-orange-300",
  },
  {
    title: "Audit Logs",
    description:
      "Review important administrative and system activity for operational traceability.",
    icon: FileSearch,
    iconClassName: "bg-rose-500/10 text-rose-300",
  },
  {
    title: "Analytics",
    description:
      "Analyze service volume, resolution patterns, SLA performance, and operational trends.",
    icon: BarChart3,
    iconClassName: "bg-blue-500/10 text-blue-300",
  },
];

export function AdministrationDashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800/80 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
          Administration Workspace
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Operations &amp; Governance
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Oversee service operations, organizational resources, SLA
          commitments, and platform governance from one centralized
          workspace.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <section aria-labelledby="operations-heading">
          <div className="mb-4">
            <h2
              id="operations-heading"
              className="text-sm font-semibold text-white"
            >
              Operations
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Core service-management responsibilities.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {administrationAreas.slice(0, 3).map((area) => {
              const Icon = area.icon;

              const content = (
                <>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${area.iconClassName}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {area.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {area.description}
                  </p>
                </>
              );

              if (area.to) {
                return (
                  <Link
                    key={area.title}
                    to={area.to}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <article
                  key={area.title}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
                >
                  {content}
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="organization-heading">
          <div className="mb-4">
            <h2
              id="organization-heading"
              className="text-sm font-semibold text-white"
            >
              Organization &amp; Service Configuration
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Manage the resources that support service delivery.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {administrationAreas.slice(3, 8).map((area) => {
              const Icon = area.icon;

              const content = (
                <>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${area.iconClassName}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-white">
                    {area.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {area.description}
                  </p>
                </>
              );

              if (area.to) {
                return (
                  <Link
                    key={area.title}
                    to={area.to}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <article
                  key={area.title}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
                >
                  {content}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}