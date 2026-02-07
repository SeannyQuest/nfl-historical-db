"use client";

import { useBettingValue } from "@/hooks/use-games";
import BettingValueDashboard from "@/components/betting-value-dashboard";

export default function BettingValuePage() {
  const { data, isLoading, isError } = useBettingValue();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Betting Value Finder</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Identify historical betting edges. Analyze performance by spread range, home underdogs, road favorites, and divisional matchups.
          </p>
        </div>
        <BettingValueDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
