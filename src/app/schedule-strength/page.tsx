"use client";

import { useScheduleStrength, useSeasons } from "@/hooks/use-games";
import { useState } from "react";

export default function ScheduleStrengthPage() {
  const { data: seasons, isLoading: loadingSeasons } = useSeasons();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const { data, isLoading, isError } = useScheduleStrength(selectedSeason);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Schedule Strength</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Analyze strength of schedule based on opponent win rates. View easiest and hardest schedules by team and season.
          </p>
        </div>

        {loadingSeasons ? (
          <div className="text-center text-[#8899aa]">Loading seasons...</div>
        ) : (
          <div className="mb-8">
            <label className="block text-sm font-medium text-[#8899aa] mb-2">Select Season</label>
            <select
              value={selectedSeason || ""}
              onChange={(e) => setSelectedSeason(e.target.value || null)}
              className="rounded border border-[#1e2a45] bg-[#141b2d] px-3 py-2 text-[#e0e0e0]"
            >
              <option value="">-- Select Season --</option>
              {seasons?.data?.seasons?.map((s: { year: number }) => (
                <option key={s.year} value={String(s.year)}>
                  {s.year}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[#5a6a7a]">Loading schedule strength data...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-400">Error loading schedule strength data</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
              <div className="border-b border-[#1e2a45] px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">Hardest Schedules</h3>
              </div>
              <div className="px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e2a45]">
                        <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Past SOS</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Future SOS</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Combined SOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a45]/50">
                      {data.stats.hardestSchedules.map((team: Record<string, string | number>) => (
                        <tr key={team.team} className="transition-colors hover:bg-[#1e2a45]/30">
                          <td className="py-2 font-medium text-[#d4af37]">{team.team}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.pastSOS}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.futureSOS}</td>
                          <td className="py-2 text-center text-[#e0e0e0]">{team.combinedSOS}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
              <div className="border-b border-[#1e2a45] px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">Easiest Schedules</h3>
              </div>
              <div className="px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e2a45]">
                        <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Past SOS</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Future SOS</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Combined SOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a45]/50">
                      {data.stats.easiestSchedules.map((team: Record<string, string | number>) => (
                        <tr key={team.team} className="transition-colors hover:bg-[#1e2a45]/30">
                          <td className="py-2 font-medium text-[#d4af37]">{team.team}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.pastSOS}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.futureSOS}</td>
                          <td className="py-2 text-center text-[#e0e0e0]">{team.combinedSOS}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
