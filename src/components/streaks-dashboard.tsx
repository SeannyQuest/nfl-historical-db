"use client";

import type { StreaksResult } from "@/lib/streaks";

interface StreaksDashboardProps {
  data: StreaksResult | null;
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

function StreakTable({ streaks }: { streaks: Array<{ teamName: string; streakType?: string; currentStreak?: number; allTimeRecord: number; season: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Streak</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {streaks.map((s, i) => (
            <tr key={i} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 text-[#d4af37]">{s.teamName}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{s.currentStreak ?? s.allTimeRecord}</td>
              <td className="py-2 text-center text-[#8899aa]">{s.season}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StreaksDashboard({ data, isLoading, isError }: StreaksDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading streaks data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load streaks data.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBox label="Active Streaks" primary={String(data.currentStreaks.length)} />
        <StatBox label="Longest Win" primary={String(data.longestWinningStreaks[0]?.allTimeRecord ?? 0)} secondary="games" />
        <StatBox label="Longest Loss" primary={String(data.longestLosingStreaks[0]?.allTimeRecord ?? 0)} secondary="games" />
      </div>

      {data.currentStreaks.length > 0 && (
        <InfoPanel title="Active Streaks">
          <StreakTable streaks={data.currentStreaks} />
        </InfoPanel>
      )}

      {data.longestWinningStreaks.length > 0 && (
        <InfoPanel title="All-Time Longest Winning Streaks">
          <StreakTable streaks={data.longestWinningStreaks} />
        </InfoPanel>
      )}

      {data.longestLosingStreaks.length > 0 && (
        <InfoPanel title="All-Time Longest Losing Streaks">
          <StreakTable streaks={data.longestLosingStreaks} />
        </InfoPanel>
      )}

      {data.longestATSStreaks.length > 0 && (
        <InfoPanel title="All-Time Longest ATS Streaks">
          <StreakTable streaks={data.longestATSStreaks} />
        </InfoPanel>
      )}
    </div>
  );
}
