"use client";

import { usePlayoffStats } from "@/hooks/use-games";
import PlayoffDashboard from "@/components/playoff-dashboard";

export default function PlayoffsPage() {
  const { data, isLoading, isError } = usePlayoffStats();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">
            Playoff History
          </h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Postseason records, Super Bowl history, and playoff trends across
            all NFL eras.
          </p>
        </div>
        <PlayoffDashboard
          stats={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
