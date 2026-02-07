"use client";

import { useFranchiseHistory } from "@/hooks/use-games";
import FranchiseHistoryDashboard from "@/components/franchise-history-dashboard";

export default function FranchiseHistoryPage() {
  const { data, isLoading, isError } = useFranchiseHistory();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Franchise History</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Complete timeline and cumulative records for all NFL franchises, including name changes and Super Bowl history.
          </p>
        </div>
        <FranchiseHistoryDashboard
          data={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
