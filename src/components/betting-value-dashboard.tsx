"use client";

import type { BettingValueResult } from "@/lib/betting-value";

interface BettingValueDashboardProps {
  data: BettingValueResult | null;
  isLoading: boolean;
  isError: boolean;
}

function StatBox({ label, primary, secondary }: { label: string; primary: string; secondary?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">{label}</span>
      <span className="mt-1 text-xl font-bold text-[#f0f0f0]">{primary}</span>
      {secondary && <span className="mt-0.5 text-xs text-[#8899aa]">{secondary}</span>}
    </div>
  );
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

function EdgeTable({ edges }: { edges: Array<{ category: string; games: number; wins: number; atsWinRate: string; roi: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Edge</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">ATS Win %</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">ROI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {edges.map((e) => (
            <tr key={e.category} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{e.category}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{e.games}</td>
              <td className="py-2 text-center text-[#8899aa]">{(parseFloat(e.atsWinRate) * 100).toFixed(1)}%</td>
              <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(e.roi) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamTable({ teams }: { teams: Array<{ team: string; games: number; atsWins: number; atsLosses: number; winRate: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">ATS Record</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {teams.map((t) => (
            <tr key={t.team} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{t.team}</td>
              <td className="py-2 text-center text-[#8899aa]">{t.games}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.atsWins}-{t.atsLosses}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(t.winRate) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BettingValueDashboard({ data, isLoading, isError }: BettingValueDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading betting value analysis...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">Error loading betting value data</p>
      </div>
    );
  }

  const stats = data.stats;
  const edges = [
    stats.homeUnderdogs,
    stats.roadFavorites,
    stats.bigSpreads,
    stats.smallSpreads,
    stats.divisionalATS,
    stats.nonDivisionalATS,
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          label="Total Games"
          primary={String(stats.totalGames)}
        />
        <StatBox
          label="Best ATS Team"
          primary={stats.bestATSTeams.length > 0 ? stats.bestATSTeams[0].team : "N/A"}
          secondary={stats.bestATSTeams.length > 0 ? `${(parseFloat(stats.bestATSTeams[0].winRate) * 100).toFixed(1)}%` : ""}
        />
        <StatBox
          label="Worst ATS Team"
          primary={stats.worstATSTeams.length > 0 ? stats.worstATSTeams[0].team : "N/A"}
          secondary={stats.worstATSTeams.length > 0 ? `${(parseFloat(stats.worstATSTeams[0].winRate) * 100).toFixed(1)}%` : ""}
        />
      </div>

      <InfoPanel title="Betting Edges">
        <EdgeTable edges={edges} />
      </InfoPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel title="Best ATS Teams">
          <TeamTable teams={stats.bestATSTeams} />
        </InfoPanel>

        <InfoPanel title="Worst ATS Teams">
          <TeamTable teams={stats.worstATSTeams} />
        </InfoPanel>
      </div>
    </div>
  );
}
