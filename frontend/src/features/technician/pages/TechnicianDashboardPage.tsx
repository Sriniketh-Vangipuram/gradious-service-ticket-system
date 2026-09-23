import { ClipboardList, Clock3, ShieldCheck } from "lucide-react";

export function TechnicianDashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800/80 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
          Technician Workspace
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Support Operations
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Monitor your assigned service requests, manage ticket workflow,
          and keep SLA commitments on track.
        </p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <ClipboardList size={18} aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-white">
            Assigned Work
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Your assigned tickets and active service requests will appear
            here.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
            <Clock3 size={18} aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-white">
            SLA Attention
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tickets approaching or exceeding their SLA targets will be
            surfaced here.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-white">
            Service Workflow
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Manage assignment, progress, customer responses, and
            resolution from one workspace.
          </p>
        </article>
      </div>
    </section>
  );
}