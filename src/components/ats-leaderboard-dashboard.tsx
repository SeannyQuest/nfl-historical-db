"use client";

import type { ATSResult } from "@/lib/ats-leaderboard";

interface ATSLeaderboardDashboardProps {
  data: ATSResult | null;
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

function LeaderboardTable({ teams }: { teams: Array<{ team: string; wins: number; losses: number; winPct: string }> }) {
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
          {teams.map((t, idx) => (
            <tr key={t.team} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{idx + 1}. {t.team}</td>
              <td className="py-2 text-center text-[#8899aa]">{t.wins + t.losses}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.wins}-{t.losses}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(t.winPct) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ATSLeaderboardDashboard({ data, isLoading, isError }: ATSLeaderboardDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading ATS leaderboard...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">Error loading ATS leaderboard</p>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox
          label="Total Games"
          primary={String(stats.totalGames)}
        />
        <StatBox
          label="Best ATS Team"
          primary={stats.bestATS.length > 0 ? stats.bestATS[0].team : "N/A"}
          secondary={stats.bestATS.length > 0 ? `${(parseFloat(stats.bestATS[0].winPct) * 100).toFixed(1)}%` : ""}
        />
        <StatBox
          label="Worst ATS Team"
          primary={stats.worstATS.length > 0 ? stats.worstATS[0].team : "N/A"}
          secondary={stats.worstATS.length > 0 ? `${(parseFloat(stats.worstATS[0].winPct) * 100).toFixed(1)}%` : ""}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel title="Best ATS Teams All-Time">
          <LeaderboardTable teams={stats.bestATS} />
        </InfoPanel>

        <InfoPanel title="Worst ATS Teams All-Time">
          <LeaderboardTable teams={stats.worstATS} />
        </InfoPanel>
      </div>
    </div>
  );
}
