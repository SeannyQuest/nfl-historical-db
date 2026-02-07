"use client";

import { useTrends } from "@/hooks/use-games";
import TrendsDashboard from "@/components/trends-dashboard";

export default function TrendsPage() {
  const { data, isLoading, isError } = useTrends();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">League Trends</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Historical scoring, home-field advantage, and betting trends across all NFL seasons.
          </p>
        </div>
        <TrendsDashboard
          trends={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
