"use client";

import { useRivalries } from "@/hooks/use-games";
import RivalryDashboard from "@/components/rivalry-dashboard";

export default function RivalriesPage() {
  const { data, isLoading, isError } = useRivalries();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Rivalry Tracker</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Explore NFL rivalries: most-played matchups, closest competitions, highest-scoring battles, and division
            rivals.
          </p>
        </div>
        <RivalryDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
