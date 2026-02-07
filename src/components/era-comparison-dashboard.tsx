"use client";

import type { EraComparisonResult } from "@/lib/era-comparison";

interface EraComparisonDashboardProps {
  data: EraComparisonResult | null;
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

function pctColor(pct: string): string {
  const val = parseFloat(pct);
  if (val > 0.55) return "text-[#22c55e]";
  if (val < 0.45) return "text-[#ef4444]";
  return "text-[#d4af37]";
}

function EraTable({ eras }: { eras: Array<{ era: string; years: string; totalGames: number; avgScoringTotal: string; homeWinPct: string; overPct: string; avgSpread: string; homeCoverPct: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Era</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Years</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Home W%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">Over%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">Avg Spread</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {eras.map((e) => (
            <tr key={e.era} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{e.era}</td>
              <td className="py-2 text-center text-[#8899aa]">{e.years}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{e.totalGames}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{e.avgScoringTotal}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(e.homeWinPct)}`}>{(parseFloat(e.homeWinPct) * 100).toFixed(1)}%</td>
              <td className={`hidden py-2 text-center md:table-cell ${pctColor(e.overPct)}`}>{(parseFloat(e.overPct) * 100).toFixed(1)}%</td>
              <td className="hidden py-2 text-center text-[#8899aa] lg:table-cell">{e.avgSpread}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NotableRecordsTable({ records }: { records: Array<{ season: number; team: string; stat: string; value: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Rank</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Record</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {records.map((r, i) => (
            <tr key={`${r.team}-${r.season}`} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">#{i + 1}</td>
              <td className="py-2 text-[#e0e0e0]">{r.team}</td>
              <td className="py-2 text-center text-[#8899aa]">{r.season}</td>
              <td className="py-2 text-[#d4af37]">{r.stat}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EraComparisonDashboard({ data, isLoading, isError }: EraComparisonDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading era comparison data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load era comparison data.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Highest Scoring" primary={data.highestScoringEra.era} secondary={`${data.highestScoringEra.avg} ppg`} />
        <StatBox label="Lowest Scoring" primary={data.lowestScoringEra.era} secondary={`${data.lowestScoringEra.avg} ppg`} />
        <StatBox label="Highest Home W%" primary={data.highestHomeWinRateEra.era} secondary={`${(parseFloat(data.highestHomeWinRateEra.pct) * 100).toFixed(1)}%`} />
        <StatBox label="Total Eras" primary={String(data.eras.length)} />
      </div>

      {data.eras.length > 0 && (
        <InfoPanel title="Era Breakdown">
          <EraTable eras={data.eras} />
        </InfoPanel>
      )}

      {data.notableRecords.length > 0 && (
        <InfoPanel title="Best Team Seasons (Win %)">
          <NotableRecordsTable records={data.notableRecords} />
        </InfoPanel>
      )}
    </div>
  );
}
