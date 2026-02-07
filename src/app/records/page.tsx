"use client";

import { useRecords } from "@/hooks/use-games";
import RecordsDashboard from "@/components/records-dashboard";

export default function RecordsPage() {
  const { data, isLoading, isError } = useRecords();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Record Book</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            All-time NFL records, superlatives, and extremes across 14,000+ games.
          </p>
        </div>
        <RecordsDashboard
          records={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
