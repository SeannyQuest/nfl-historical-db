"use client";

import type { TrendsResult, SeasonTrend, PrimetimeTrend } from "@/lib/trends";

interface TrendsDashboardProps {
  trends: TrendsResult | null;
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

function SeasonTable({ seasons }: { seasons: SeasonTrend[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Year</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home W%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Over%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Home Cover%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">H-A-T</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {seasons.map((s) => (
            <tr key={s.season} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#e0e0e0]">{s.season}</td>
              <td className="py-2 text-center text-[#8899aa]">{s.totalGames}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{s.avgTotal}</td>
              <td className={`py-2 text-center ${pctColor(s.homeWinPct)}`}>{s.homeWinPct}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(s.overPct)}`}>{s.overPct}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(s.homeCoverPct)}`}>{s.homeCoverPct}</td>
              <td className="hidden py-2 text-center text-[#8899aa] md:table-cell">
                {s.homeWins}-{s.awayWins}-{s.ties}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrimetimeTable({ slots }: { slots: PrimetimeTrend[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Slot</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home W%</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Over%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {slots.map((p) => (
            <tr key={p.slot} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{p.slot}</td>
              <td className="py-2 text-center text-[#8899aa]">{p.totalGames}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{p.avgTotal}</td>
              <td className={`py-2 text-center ${pctColor(p.homeWinPct)}`}>{p.homeWinPct}</td>
              <td className={`py-2 text-center ${pctColor(p.overPct)}`}>{p.overPct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrendsDashboard({ trends, isLoading, isError }: TrendsDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading trends data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load trends data.</p>
      </div>
    );
  }

  if (!trends) return null;

  const pvr = trends.playoffVsRegular;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatBox label="Total Games" primary={String(trends.totalGames)} secondary={`${trends.totalSeasons} seasons`} />
        <StatBox label="Avg Total" primary={trends.overallAvgTotal} secondary="points per game" />
        <StatBox label="Home Win %" primary={trends.overallHomeWinPct} />
        <StatBox label="Over %" primary={trends.overallOverPct} />
        <StatBox
          label="Scoring Range"
          primary={`${trends.lowestScoringGame.total}–${trends.highestScoringGame.total}`}
          secondary="low – high"
        />
      </div>

      {/* Playoff vs Regular comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel title="Regular Season">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Avg Total Points" value={pvr.regular.avgTotal} />
            <DataRow
              label="Home Win %"
              value={pvr.regular.homeWinPct}
              color={pctColor(pvr.regular.homeWinPct)}
            />
          </div>
        </InfoPanel>
        <InfoPanel title="Playoffs">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Avg Total Points" value={pvr.playoff.avgTotal} />
            <DataRow
              label="Home Win %"
              value={pvr.playoff.homeWinPct}
              color={pctColor(pvr.playoff.homeWinPct)}
            />
          </div>
        </InfoPanel>
      </div>

      {/* Primetime breakdown */}
      {trends.primetime.length > 0 && (
        <InfoPanel title="Primetime Breakdown">
          <PrimetimeTable slots={trends.primetime} />
        </InfoPanel>
      )}

      {/* Season-by-season */}
      {trends.seasons.length > 0 && (
        <InfoPanel title="Season-by-Season">
          <SeasonTable seasons={trends.seasons} />
        </InfoPanel>
      )}
    </div>
  );
}
