"use client";

import { usePrimetimeStats } from "@/hooks/use-games";
import PrimetimeDashboard from "@/components/primetime-dashboard";

export default function PrimetimePage() {
  const { data, isLoading, isError } = usePrimetimeStats();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Primetime Performance</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive analysis of NFL primetime games (MNF, SNF, TNF). Track team performance, upsets, blowouts, and compare primetime
            vs regular season scoring and home-field advantage trends.
          </p>
        </div>
        <PrimetimeDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
