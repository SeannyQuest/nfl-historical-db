"use client";

import type { CloseGamesResult } from "@/lib/close-games";

interface CloseGamesDashboardProps {
  data: CloseGamesResult | null;
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

function DataRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#8899aa]">{label}</span>
      <span className={`text-sm font-medium ${color ?? "text-[#e0e0e0]"}`}>{value}</span>
    </div>
  );
}

function TeamTable({ teams }: { teams: Array<{ team: string; gamesAt3Pts: number; winsAt3Pts: number; gamesAt7Pts: number; winsAt7Pts: number; gamesAt10Pts: number; winsAt10Pts: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">≤3 Pts</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">≤7 Pts</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">≤10 Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {teams.map((t) => (
            <tr key={t.team} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{t.team}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.winsAt3Pts}-{t.gamesAt3Pts - t.winsAt3Pts}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.winsAt7Pts}-{t.gamesAt7Pts - t.winsAt7Pts}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.winsAt10Pts}-{t.gamesAt10Pts - t.winsAt10Pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CloseGamesDashboard({ data, isLoading, isError }: CloseGamesDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading close games analysis...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">Error loading close games data</p>
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
          label="Games within 3 pts"
          primary={String(stats.gamesAt3Pts)}
          secondary={`${(parseFloat(stats.closeGameRateAt3Pts) * 100).toFixed(1)}%`}
        />
        <StatBox
          label="Games within 7 pts"
          primary={String(stats.gamesAt7Pts)}
          secondary={`${(parseFloat(stats.closeGameRateAt7Pts) * 100).toFixed(1)}%`}
        />
        <StatBox
          label="Primetime Close Games"
          primary={String(stats.primetimeCloseGames)}
          secondary={`${(parseFloat(stats.primetimeCloseGameRate) * 100).toFixed(1)}%`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoPanel title="Best Clutch Teams (≤7 pts)">
          <TeamTable teams={stats.bestClutchTeams} />
        </InfoPanel>

        <InfoPanel title="Worst Clutch Teams (≤7 pts)">
          <TeamTable teams={stats.worstClutchTeams} />
        </InfoPanel>
      </div>

      <InfoPanel title="Close Game Stats">
        <div className="space-y-2">
          <DataRow
            label="Games at 10 pts or less"
            value={`${stats.gamesAt10Pts} (${(parseFloat(stats.closeGameRateAt10Pts) * 100).toFixed(1)}%)`}
          />
        </div>
      </InfoPanel>
    </div>
  );
}
