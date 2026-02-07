"use client";

import { usePowerRankings } from "@/hooks/use-games";
import PowerRankingsDashboard from "@/components/power-rankings-dashboard";

export default function PowerRankingsPage() {
  const { data, isLoading, isError } = usePowerRankings();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Power Rankings</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive power rankings based on win percentage, strength of schedule, point differential, and recent form. See which teams truly dominate.
          </p>
        </div>
        <PowerRankingsDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
