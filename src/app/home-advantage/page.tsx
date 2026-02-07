"use client";

import { useHomeAdvantage } from "@/hooks/use-games";
import HomeAdvantageDashboard from "@/components/home-advantage-dashboard";

export default function HomeAdvantagePage() {
  const { data, isLoading, isError } = useHomeAdvantage();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Home Field Advantage</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive analysis of home-field advantage across NFL seasons, including dome vs outdoor, day of week,
            and playoff trends.
          </p>
        </div>
        <HomeAdvantageDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
