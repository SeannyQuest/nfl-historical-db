"use client";

import { useState } from "react";
import { useStandings, useSeasons } from "@/hooks/use-games";
import StandingsDashboard from "@/components/standings-dashboard";

export default function StandingsPage() {
  const [season, setSeason] = useState<string | null>(null);
  const { data: seasonsData } = useSeasons();
  const { data, isLoading, isError } = useStandings(season);

  const seasons: { year: number }[] = seasonsData?.data ?? [];

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Standings</h1>
            <p className="mt-2 text-sm text-[#8899aa]">
              {season ? `${season} regular season standings` : "All-time regular season standings"} by division.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              aria-label="Select season"
              value={season ?? ""}
              onChange={(e) => setSeason(e.target.value || null)}
              className="input-glow rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] transition-colors hover:border-[#d4af37] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="">All-Time</option>
              {seasons.map((s) => (
                <option key={s.year} value={String(s.year)}>
                  {s.year}
                </option>
              ))}
            </select>
            {season && (
              <button
                onClick={() => setSeason(null)}
                className="rounded border border-[#2a3a55] px-3 py-2 text-sm text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <StandingsDashboard
          standings={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
