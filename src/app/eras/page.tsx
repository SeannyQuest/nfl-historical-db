"use client";

import { useEraComparison } from "@/hooks/use-games";
import EraComparisonDashboard from "@/components/era-comparison-dashboard";

export default function ErasPage() {
  const { data, isLoading, isError } = useEraComparison();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">NFL Era Comparison</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive analysis of NFL eras: Pre-Merger (1966-1969), Early Modern (1970-1989), Salary Cap Era (1994-2009), and Modern Era
            (2010+). Compare scoring trends, home-field advantage, and performance metrics across generations.
          </p>
        </div>
        <EraComparisonDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
