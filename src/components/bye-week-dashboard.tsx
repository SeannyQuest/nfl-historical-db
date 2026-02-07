"use client";

import type { ByeWeekStats } from "@/lib/bye-week";

interface ByeWeekDashboardProps {
  data: { stats: ByeWeekStats } | null;
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

function DataRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#8899aa]">{label}</span>
      <span className={`text-sm font-medium ${color ?? "text-[#e0e0e0]"}`}>{value}</span>
    </div>
  );
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

function pctColor(pct: string, threshold: number = 0.5): string {
  const val = parseFloat(pct);
  if (val > threshold) return "text-[#22c55e]";
  if (val < threshold) return "text-[#ef4444]";
  return "text-[#d4af37]";
}

function TrendTable({ trends }: { trends: ByeWeekStats["byeWeekTrends"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">On Bye Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">On Bye Win %</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Not Bye Games</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Not Bye Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {trends.map((t) => (
            <tr key={t.season} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{t.season}</td>
              <td className="py-2 text-center text-[#8899aa]">{t.gamesOnBye}</td>
              <td className={`py-2 text-center ${pctColor(t.byeWinPct)}`}>{t.byeWinPct}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{t.gamesNotOnBye}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(t.notByeWinPct)}`}>{t.notByeWinPct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ByeWeekDashboard({ data, isLoading, isError }: ByeWeekDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading bye week impact data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load bye week impact data.</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Total Games" primary={String(stats.totalGames)} />
        <StatBox label="On Bye Win %" primary={stats.recordOnBye.winPct} />
        <StatBox label="Not Bye Win %" primary={stats.recordNotOnBye.winPct} />
        <StatBox label="Opp On Bye Win %" primary={stats.opponentOnByeStats.winPct} />
      </div>

      {/* On Bye vs Not On Bye comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel title="Coming Off Bye">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Wins" value={stats.recordOnBye.wins} />
            <DataRow label="Losses" value={stats.recordOnBye.losses} />
            <DataRow label="Ties" value={stats.recordOnBye.ties} />
            <DataRow
              label="Win %"
              value={stats.recordOnBye.winPct}
              color={pctColor(stats.recordOnBye.winPct)}
            />
            <DataRow
              label="Scoring Differential"
              value={stats.scoringDifferentialOnBye}
              color={parseFloat(stats.scoringDifferentialOnBye) > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}
            />
            <DataRow
              label="Cover Rate"
              value={stats.coverRateOnBye}
              color={pctColor(stats.coverRateOnBye)}
            />
          </div>
        </InfoPanel>

        <InfoPanel title="Not Coming Off Bye">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Wins" value={stats.recordNotOnBye.wins} />
            <DataRow label="Losses" value={stats.recordNotOnBye.losses} />
            <DataRow label="Ties" value={stats.recordNotOnBye.ties} />
            <DataRow
              label="Win %"
              value={stats.recordNotOnBye.winPct}
              color={pctColor(stats.recordNotOnBye.winPct)}
            />
            <DataRow
              label="Scoring Differential"
              value={stats.scoringDifferentialNotOnBye}
              color={parseFloat(stats.scoringDifferentialNotOnBye) > 0 ? "text-[#22c55e]" : "text-[#ef4444]"}
            />
            <DataRow
              label="Cover Rate"
              value={stats.coverRateNotOnBye}
              color={pctColor(stats.coverRateNotOnBye)}
            />
          </div>
        </InfoPanel>
      </div>

      {/* Opponent on bye */}
      <InfoPanel title="Playing Against Team on Bye">
        <div className="divide-y divide-[#1e2a45]/50">
          <DataRow label="Wins" value={stats.opponentOnByeStats.wins} />
          <DataRow label="Losses" value={stats.opponentOnByeStats.losses} />
          <DataRow label="Ties" value={stats.opponentOnByeStats.ties} />
          <DataRow
            label="Win %"
            value={stats.opponentOnByeStats.winPct}
            color={pctColor(stats.opponentOnByeStats.winPct)}
          />
        </div>
      </InfoPanel>

      {/* Season trends */}
      {stats.byeWeekTrends.length > 0 && (
        <InfoPanel title="Season-by-Season Bye Week Trends">
          <TrendTable trends={stats.byeWeekTrends} />
        </InfoPanel>
      )}
    </div>
  );
}
