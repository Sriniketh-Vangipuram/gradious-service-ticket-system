import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ROUTES } from "../../../constants/routes";
import { CreateTicketForm } from "../components/CreateTicketForm";
import {
  useTicketCategories,
  useTicketSoftware,
} from "../hooks/useTicketCatalog";
import { useCreateTicket } from "../hooks/useCreateTicket";

export function CreateTicketPage() {
  const navigate = useNavigate();

  const categoriesQuery = useTicketCategories();
  const softwareQuery = useTicketSoftware();
  const createTicketMutation = useCreateTicket();

  if (categoriesQuery.isPending || softwareQuery.isPending) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-56 rounded bg-slate-800" />
            <div className="h-4 w-96 rounded bg-slate-800" />
            <div className="h-12 rounded-xl bg-slate-800" />
            <div className="h-32 rounded-xl bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (categoriesQuery.isError || softwareQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-8">
          <h1 className="text-lg font-semibold text-white">
            Unable to load ticket options
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            We couldn't load the information needed to create your ticket.
            Please try again.
          </p>

          <button
            type="button"
            onClick={() => {
              void categoriesQuery.refetch();
              void softwareQuery.refetch();
            }}
            className="mt-5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-sm font-medium text-cyan-400">
          Service Desk
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Create a ticket
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Tell us what you need help with. Provide enough detail so the
          service desk can understand and resolve your request efficiently.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl shadow-black/10 sm:p-8">
        <CreateTicketForm
          categories={categoriesQuery.data}
          software={softwareQuery.data}
          isSubmitting={createTicketMutation.isPending}
          onSubmit={(values) => {
            createTicketMutation.mutate(values, {
              onSuccess: () => {
                toast.success("Ticket created successfully.", {
                  description:
                    "Your service request has been submitted to the service desk.",
                });

                navigate(ROUTES.app.tickets);
              },
              onError: (error) => {
                toast.error("Unable to create ticket.", {
                  description:
                    error instanceof Error
                      ? error.message
                      : "Something went wrong while creating your ticket.",
                });
              },
            });
          }}
        />
      </div>
    </div>
  );
}