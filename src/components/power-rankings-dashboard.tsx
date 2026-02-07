"use client";

import type { PowerRankingsResult } from "@/lib/power-rankings";

interface PowerRankingsDashboardProps {
  data: PowerRankingsResult | null;
  isLoading: boolean;
  isError: boolean;
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
      <div className="border-b border-[#1e2a45] px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function RankingTable({ rankings }: { rankings: Array<{ rank: number; team: string; winPct: string; sos: string; pointDifferential: string; recentForm: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Rank</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win %</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">SOS</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Pt Diff</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Recent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {rankings.map((r) => (
            <tr key={r.rank} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-bold text-[#d4af37]">{r.rank}</td>
              <td className="py-2 font-medium text-[#e0e0e0]">{r.team}</td>
              <td className="py-2 text-center text-[#8899aa]">{(parseFloat(r.winPct) * 100).toFixed(1)}%</td>
              <td className="py-2 text-center text-[#8899aa]">{r.sos}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{r.pointDifferential}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{r.recentForm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PowerRankingsDashboard({ data, isLoading, isError }: PowerRankingsDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading power rankings...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">Error loading power rankings</p>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="space-y-8">
      <InfoPanel title={`Season ${stats.season} Power Rankings`}>
        <RankingTable rankings={stats.rankings} />
      </InfoPanel>
    </div>
  );
}
