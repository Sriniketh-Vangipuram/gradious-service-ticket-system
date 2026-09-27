import { useAuth } from "../../../auth/hooks/useAuth";

import { useCenters } from "../../centers/hooks/useCenters";

import { useCategories } from "../../categories/hooks/useCategories";

import {
  useAnalyticsOverview,
  useTicketTrends,
  useAnalyticsByCenter,
  useAnalyticsByCategory,
  useAnalyticsByPriority,
  useTechnicianWorkload,
} from "../hooks/useAnalytics";

import {
  useAnalyticsFilters,
} from "../hooks/useAnalyticsFilters";

import { AnalyticsFilters } from "../components/AnalyticsFilters";

import { AnalyticsOverviewCards } from "../components/AnalyticsOverviewCards";

import { TicketVolumeChart } from "../components/TicketVolumeChart";

import { TicketTrendChart } from "../components/TicketTrendChart";

import { BreakdownChart } from "../components/BreakdownChart";

import { PriorityBreakdown } from "../components/PriorityBreakdown";

import { SlaComplianceCard } from "../components/SlaComplianceCard";

import { TimeMetricCard } from "../components/TimeMetricCard";

import { TechnicianWorkloadTable } from "../components/TechnicianWokrloadTable";

export function AnalyticsPage() {
  const { user } = useAuth();

  const {
    filters,
    analyticsFilters,
    trendFilters,
    updateFilters,
    resetFilters,
  } = useAnalyticsFilters();

  const centersQuery = useCenters();

  const categoriesQuery = useCategories();

  /*
   * ------------------------------------------------------------------------
   * Analytics queries
   * ------------------------------------------------------------------------
   */

  const overviewQuery =
    useAnalyticsOverview(
      analyticsFilters,
    );

  const trendsQuery =
    useTicketTrends(
      trendFilters,
    );

  const centerQuery =
    useAnalyticsByCenter(
      analyticsFilters,
    );

  const categoryQuery =
    useAnalyticsByCategory(
      analyticsFilters,
    );

  const priorityQuery =
    useAnalyticsByPriority(
      analyticsFilters,
    );

  const technicianQuery =
    useTechnicianWorkload(
      analyticsFilters,
    );

  /*
   * ------------------------------------------------------------------------
   * Center options
   *
   * CENTER_MANAGER:
   *   Only authorized centers should be presented in the UI.
   *
   * ADMIN:
   *   All centers returned by the centers endpoint are available.
   *
   * Backend authorization remains the real security boundary.
   * ------------------------------------------------------------------------
   */

   

  const availableCenters =
   user?.role === "CENTER_MANAGER"
    ? user.authorizedCenters ?? []
    : centersQuery.data?.data?.data ?? [];

  const availableCategories =
    categoriesQuery.data?.data?.data ??
    [];

  /*
   * ------------------------------------------------------------------------
   * Filter handler
   * ------------------------------------------------------------------------
   */

  const handleFilterChange = (
    updates: Parameters<
      typeof updateFilters
    >[0],
  ) => {
    updateFilters(updates);
  };

  return (
    <main className="space-y-6 p-6">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header                                                        */}
      {/* ------------------------------------------------------------------ */}

      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Operations
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Analytics
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Monitor ticket volume, service performance,
          SLA compliance, and technician workload
          across your authorized service scope.
        </p>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Filters                                                            */}
      {/* ------------------------------------------------------------------ */}

      <AnalyticsFilters
        from={filters.from}
        to={filters.to}
        centerId={filters.centerId}
        categoryId={filters.categoryId}
        priority={filters.priority}
        granularity={filters.granularity}
        centers={availableCenters}
        categories={availableCategories}
        isLoadingCenters={
          centersQuery.isLoading
        }
        isLoadingCategories={
          categoriesQuery.isLoading
        }
        onChange={
          handleFilterChange
        }
        onReset={resetFilters}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Overview                                                            */}
      {/* ------------------------------------------------------------------ */}

      <AnalyticsOverviewCards
        data={
          overviewQuery.data?.data
        }
        isLoading={
          overviewQuery.isLoading
        }
        isError={
          overviewQuery.isError
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ticket Volume + Trends                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-2">
        <TicketVolumeChart
          data={
            overviewQuery.data?.data
              ?.ticketVolume
          }
          isLoading={
            overviewQuery.isLoading
          }
          isError={
            overviewQuery.isError
          }
        />

        <TicketTrendChart
          data={
            trendsQuery.data?.data
          }
          granularity={
            filters.granularity
          }
          isLoading={
            trendsQuery.isLoading
          }
          isError={
            trendsQuery.isError
          }
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Center + Category                                                  */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-2">
        <BreakdownChart
          title="Tickets by Center"
          description="Ticket volume distributed across service centers."
          data={
            centerQuery.data?.data
          }
          isLoading={
            centerQuery.isLoading
          }
          isError={
            centerQuery.isError
          }
        />

        <BreakdownChart
          title="Tickets by Category"
          description="Ticket volume distributed across service categories."
          data={
            categoryQuery.data?.data
          }
          isLoading={
            categoryQuery.isLoading
          }
          isError={
            categoryQuery.isError
          }
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Priority + SLA                                                     */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-2">
        <PriorityBreakdown
          data={
            priorityQuery.data?.data
          }
          isLoading={
            priorityQuery.isLoading
          }
          isError={
            priorityQuery.isError
          }
        />

        <SlaComplianceCard
          data={
            overviewQuery.data?.data
              ?.slaCompliance
          }
          isLoading={
            overviewQuery.isLoading
          }
          isError={
            overviewQuery.isError
          }
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Response + Resolution Time                                         */}
      {/* ------------------------------------------------------------------ */}

      <section className="grid gap-6 xl:grid-cols-2">
        <TimeMetricCard
          title="First Response Time"
          description="Average elapsed time from ticket creation to the first response."
          data={
            overviewQuery.data?.data
              ?.responseTime
          }
          isLoading={
            overviewQuery.isLoading
          }
          isError={
            overviewQuery.isError
          }
        />

        <TimeMetricCard
          title="Resolution Time"
          description="Average elapsed time from ticket creation to resolution."
          data={
            overviewQuery.data?.data
              ?.resolutionTime
          }
          isLoading={
            overviewQuery.isLoading
          }
          isError={
            overviewQuery.isError
          }
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Technician Workload                                                */}
      {/* ------------------------------------------------------------------ */}

      <TechnicianWorkloadTable
        data={
          technicianQuery.data?.data
        }
        isLoading={
          technicianQuery.isLoading
        }
        isError={
          technicianQuery.isError
        }
      />
    </main>
  );
}