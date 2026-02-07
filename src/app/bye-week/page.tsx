"use client";

import { useByeWeekImpact } from "@/hooks/use-games";
import ByeWeekDashboard from "@/components/bye-week-dashboard";

export default function ByeWeekPage() {
  const { data, isLoading, isError } = useByeWeekImpact();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Bye Week Impact</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Analysis of team performance coming off bye weeks, including scoring, cover rates, and trends across seasons.
          </p>
        </div>
        <ByeWeekDashboard
          data={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
