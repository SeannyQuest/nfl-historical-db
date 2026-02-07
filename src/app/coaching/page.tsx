"use client";

import { useCoachingStats } from "@/hooks/use-games";

export default function CoachingPage() {
  const { data, isLoading, isError } = useCoachingStats();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Coaching Records & Analysis</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Analyze coaching effectiveness through team-level statistics. Track year-over-year improvements, consistency scores, and turnaround teams.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[#5a6a7a]">Loading coaching stats...</p>
          </div>
        ) : isError || !data ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-red-400">Error loading coaching stats</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
              <div className="border-b border-[#1e2a45] px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">Most Improved Teams</h3>
              </div>
              <div className="px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e2a45]">
                        <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">From Season</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">To Season</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Improvement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a45]/50">
                      {data.stats.mostImprovedTeams.map((team: Record<string, string | number>, idx: number) => (
                        <tr key={`${team.team}-${idx}`} className="transition-colors hover:bg-[#1e2a45]/30">
                          <td className="py-2 font-medium text-[#d4af37]">{team.team}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.previousSeason} ({team.previousWinPct})</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.currentSeason} ({team.currentWinPct})</td>
                          <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(team.improvement) * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
              <div className="border-b border-[#1e2a45] px-5 py-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">Most Consistent Teams</h3>
              </div>
              <div className="px-5 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#1e2a45]">
                        <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Seasons</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Win %</th>
                        <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Consistency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2a45]/50">
                      {data.stats.consistentTeams.map((team: Record<string, string | number>) => (
                        <tr key={team.team} className="transition-colors hover:bg-[#1e2a45]/30">
                          <td className="py-2 font-medium text-[#d4af37]">{team.team}</td>
                          <td className="py-2 text-center text-[#8899aa]">{team.seasons}</td>
                          <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(team.avgWinPct) * 100).toFixed(1)}%</td>
                          <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(team.consistencyScore) * 100).toFixed(1)}%</td>
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
