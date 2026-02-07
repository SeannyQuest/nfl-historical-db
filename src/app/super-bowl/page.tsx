"use client";

import { useSuperBowlStats } from "@/hooks/use-games";
import SuperBowlDashboard from "@/components/super-bowl-dashboard";

export default function SuperBowlPage() {
  const { data, isLoading, isError } = useSuperBowlStats();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Super Bowl History</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive Super Bowl statistics including champions, biggest blowouts, closest games, and dynasty tracking.
          </p>
        </div>
        <SuperBowlDashboard
          data={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
