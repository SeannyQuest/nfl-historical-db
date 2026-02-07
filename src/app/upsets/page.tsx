"use client";

import { useUpsets } from "@/hooks/use-games";
import UpsettsDashboard from "@/components/upsets-dashboard";

export default function UpsetPage() {
  const { data, isLoading, isError } = useUpsets();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Upset Tracker</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Analyze underdog upsets by spread range, primetime slot, and season trends. Discover which teams win most as
            underdogs.
          </p>
        </div>
        <UpsettsDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
