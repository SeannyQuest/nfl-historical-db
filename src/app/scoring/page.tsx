"use client";

import { useScoringAnalysis } from "@/hooks/use-games";
import ScoringDashboard from "@/components/scoring-dashboard";

export default function ScoringPage() {
  const { data, isLoading, isError } = useScoringAnalysis();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Scoring Analysis</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Distribution analysis, trends, and patterns in NFL scoring across eras, days of the week, and primetime slots.
          </p>
        </div>
        <ScoringDashboard
          analysis={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
