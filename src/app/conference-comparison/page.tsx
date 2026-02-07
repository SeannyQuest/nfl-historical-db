"use client";

import { useConferenceComparison } from "@/hooks/use-games";
import ConferenceComparisonDashboard from "@/components/conference-comparison-dashboard";

export default function ConferenceComparisonPage() {
  const { data, isLoading, isError } = useConferenceComparison();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">AFC vs NFC Comparison</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Historical head-to-head records between the AFC and NFC, including Super Bowl results and season-by-season trends.
          </p>
        </div>
        <ConferenceComparisonDashboard
          data={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
