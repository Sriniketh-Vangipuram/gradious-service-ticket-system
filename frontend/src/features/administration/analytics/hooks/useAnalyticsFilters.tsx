import { useMemo, useState } from "react";

import type {
  AnalyticsFilters,
  AnalyticsGranularity,
  AnalyticsTrendFilters,
  TicketPriority,
} from "../types/analytics.types";

interface AnalyticsFilterState {
  from: string;
  to: string;
  centerId?: number;
  categoryId?: number;
  priority?: TicketPriority;
  granularity: AnalyticsGranularity;
}

function getInitialDates() {
  const today = new Date();

  const thirtyDaysAgo = new Date(today);

  thirtyDaysAgo.setDate(
    today.getDate() - 29,
  );

  return {
    from: formatDate(thirtyDaysAgo),
    to: formatDate(today),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function useAnalyticsFilters() {
  const initialDates = useMemo(
    () => getInitialDates(),
    [],
  );

  const [filters, setFilters] =
    useState<AnalyticsFilterState>({
      from: initialDates.from,
      to: initialDates.to,
      granularity: "day",
    });

  const analyticsFilters =
    useMemo<AnalyticsFilters>(
      () => ({
        from: filters.from,
        to: filters.to,

        ...(filters.centerId !== undefined && {
          centerId: filters.centerId,
        }),

        ...(filters.categoryId !== undefined && {
          categoryId: filters.categoryId,
        }),

        ...(filters.priority !== undefined && {
          priority: filters.priority,
        }),
      }),
      [
        filters.from,
        filters.to,
        filters.centerId,
        filters.categoryId,
        filters.priority,
      ],
    );

  const trendFilters =
    useMemo<AnalyticsTrendFilters>(
      () => ({
        ...analyticsFilters,
        granularity: filters.granularity,
      }),
      [
        analyticsFilters,
        filters.granularity,
      ],
    );

  const updateFilters = (
    updates: Partial<AnalyticsFilterState>,
  ) => {
    setFilters((current) => ({
      ...current,
      ...updates,
    }));
  };

  const resetFilters = () => {
    setFilters({
      from: initialDates.from,
      to: initialDates.to,
      granularity: "day",
    });
  };

  return {
    filters,

    analyticsFilters,

    trendFilters,

    updateFilters,

    resetFilters,
  };
}