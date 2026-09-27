import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { RefreshCw } from "lucide-react";

import { ROUTES } from "../../../../constants/routes";


import { useSlaOverview } from "../hooks/useSlaOverview";
import { useSlaTickets } from "../hooks/useSlaTickets";

import { SlaOverviewCards } from "../components/SlaOverviewCards";
import { SlaFilters } from "../components/SlaFilters";
import { SlaTicketTable } from "../components/SlaTicketTable";
import { SlaPagination } from "../components/SlaPagination";
import { useCategories } from "../../categories/hooks/useCategories";
import { useUsers } from "../../users/hooks/useUsers";
import { useCenters } from "../../centers/hooks/useCenters";

import type {
  SlaTicketFilters,
} from "../types/sla.types";

export default function SlaMonitoringPage() {
  const navigate = useNavigate();

  const categoriesQuery = useCategories({
    isActive: true,
    limit: 100,
    });

  const techniciansQuery = useUsers({
    role: "TECHNICIAN",
    isActive: true,
    limit: 100,
    });

  const centersQuery = useCenters({
  page: 1,
  limit: 100,
});
  const [filters, setFilters] =
    useState<SlaTicketFilters>({
      limit: 20,
    });

  const [cursorHistory, setCursorHistory] =
    useState<(number | undefined)[]>([
      undefined,
    ]);

  const currentCursor =
    cursorHistory[
      cursorHistory.length - 1
    ];

  const ticketQueryParams =
    useMemo<SlaTicketFilters>(
      () => ({
        ...filters,
        cursor: currentCursor,
      }),
      [filters, currentCursor],
    );

  const overviewParams = useMemo(
    () => ({
      centerId: filters.centerId,
    }),
    [filters.centerId],
  );

  const overviewQuery =
    useSlaOverview(overviewParams);

  console.log("SLA FILTERS:", filters);
  console.log("SLA QUERY PARAMS:", ticketQueryParams);

  const ticketsQuery =
    useSlaTickets(ticketQueryParams);

  const overview =
    overviewQuery.data?.data;

  const tickets =
    ticketsQuery.data?.data.items ?? [];

  const pagination =
    ticketsQuery.data?.data.pagination;

  /*
   * The authenticated user's authorized centers
   * are already provided by /auth/me.
   *
   * Backend authorization remains authoritative.
   */
  const centers = useMemo(
  () =>
    centersQuery.data?.data.data.map(
      (center) => ({
        id: center.id,
        name: center.name,
      }),
    ) ?? [],
  [centersQuery.data],
);

  /*
   * Category and assignee options will be connected
   * to their existing administration APIs when we
   * wire the shared lookup data into this page.
   *
   * Keeping the filter component presentational means
   * that this page owns the data-fetching responsibility.
   */
  const categories = useMemo(
  () =>
    categoriesQuery.data?.data?.data.map(
      (category) => ({
        id: category.id,
        name: category.name,
      }),
    ) ?? [],
  [categoriesQuery.data],
);

  const assignees = useMemo(
  () =>
    techniciansQuery.data?.pages
      .flatMap((page) => page.data)
      .map((technician) => ({
        id: technician.id,
        name: technician.fullName,
      })) ?? [],
  [techniciansQuery.data],
);

  const handleFiltersChange = (
    nextFilters: SlaTicketFilters,
  ) => {
    setFilters({
      ...nextFilters,
      cursor: undefined,
    });

    setCursorHistory([undefined]);
  };

  const handleResetFilters = () => {
    setFilters({
      limit: 20,
    });

    setCursorHistory([undefined]);
  };

  const handleNext = () => {
    const nextCursor =
      pagination?.nextCursor;

    if (
      !pagination?.hasNextPage ||
      nextCursor === null ||
      nextCursor === undefined
    ) {
      return;
    }

    setCursorHistory((previous) => [
      ...previous,
      nextCursor,
    ]);
  };

  const handlePrevious = () => {
    if (cursorHistory.length <= 1) {
      return;
    }

    setCursorHistory((previous) =>
      previous.slice(0, -1),
    );
  };

  const handleTicketClick = (
    ticketId: number,
  ) => {
    navigate(
      ROUTES.app.ticket(ticketId),
    );
  };

  const handleRefresh = () => {
    void overviewQuery.refetch();
    void ticketsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            SLA Monitoring
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Monitor first-response and resolution
            commitments across service tickets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={
            overviewQuery.isFetching ||
            ticketsQuery.isFetching
          }
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 lg:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              overviewQuery.isFetching ||
              ticketsQuery.isFetching
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Overview */}
      {overview && (
        <SlaOverviewCards
          overview={overview}
          isLoading={
            overviewQuery.isLoading
          }
        />
      )}

      {!overview &&
        overviewQuery.isLoading && (
          <SlaOverviewCards
            overview={{
              tickets: {
                active: 0,
                paused: 0,
                dueSoon: 0,
                overdue: 0,
              },
              firstResponse: {
                pending: 0,
                atRisk: 0,
                overdue: 0,
                met: 0,
              },
              resolution: {
                pending: 0,
                atRisk: 0,
                paused: 0,
                overdue: 0,
                met: 0,
                breached: 0,
                cancelled: 0,
              },
            }}
            isLoading
          />
        )}

      {/* Filters */}
      <SlaFilters
        filters={filters}
        centers={centers}
        categories={categories}
        assignees={assignees}
        onChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      {/* Ticket table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              SLA Tickets
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Current tickets matching the selected
              SLA filters.
            </p>
          </div>
        </div>

        <SlaTicketTable
          tickets={tickets}
          isLoading={
            ticketsQuery.isLoading ||
            ticketsQuery.isFetching
          }
          onTicketClick={handleTicketClick}
        />

        <SlaPagination
          hasPreviousPage={
            cursorHistory.length > 1
          }
          hasNextPage={
            pagination?.hasNextPage ?? false
          }
          isLoading={
            ticketsQuery.isFetching
          }
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

      {/* Error states */}
      {overviewQuery.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Failed to load SLA overview.
        </div>
      )}

      {ticketsQuery.isError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          Failed to load SLA tickets.
        </div>
      )}
    </div>
  );
}