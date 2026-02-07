"use client";

import { useDivisionHistory } from "@/hooks/use-games";
import DivisionHistoryDashboard from "@/components/division-history-dashboard";

export default function DivisionHistoryPage() {
  const { data, isLoading, isError } = useDivisionHistory();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Division History & Dominance</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Track division winners by season, division dominance rankings, intra-division records, and division strength metrics. Analyze
            competitive balance and historic rivalries across the NFL.
          </p>
        </div>
        <DivisionHistoryDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
