import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SlaPaginationProps {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function SlaPagination({
  hasPreviousPage,
  hasNextPage,
  isLoading = false,
  onPrevious,
  onNext,
}: SlaPaginationProps) {
  if (!hasPreviousPage && !hasNextPage) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4">
      <p className="text-xs text-slate-500">
        Showing current SLA results
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasPreviousPage || isLoading}
          onClick={onPrevious}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </button>

        <button
          type="button"
          disabled={!hasNextPage || isLoading}
          onClick={onNext}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}