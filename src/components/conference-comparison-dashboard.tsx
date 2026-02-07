"use client";

import type { ConferenceComparisonResult, ConferenceStats } from "@/lib/conference-comparison";

interface ConferenceComparisonDashboardProps {
  data: ConferenceComparisonResult | null;
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

function ConferencePanel({
  name,
  stats,
}: {
  name: "AFC" | "NFC";
  stats: ConferenceStats;
}) {
  return (
    <InfoPanel title={`${name} Statistics`}>
      <div className="divide-y divide-[#1e2a45]/50">
        <DataRow label="Record" value={`${stats.totalWins}-${stats.totalLosses}-${stats.totalTies}`} />
        <DataRow label="Win %" value={stats.winPct} color={pctColor(stats.winPct)} />
        <DataRow label="Home: W-L" value={`${stats.homeWins}-${stats.homeLosses}`} />
        <DataRow label="Home Win %" value={stats.homeWinPct} color={pctColor(stats.homeWinPct)} />
        <DataRow label="Away: W-L" value={`${stats.awayWins}-${stats.awayLosses}`} />
        <DataRow label="Away Win %" value={stats.awayWinPct} color={pctColor(stats.awayWinPct)} />
        <DataRow label="ATS Record" value={`${stats.atsWins}-${stats.atsTotal - stats.atsWins}`} />
        <DataRow label="ATS %" value={stats.atsPct} color={pctColor(stats.atsPct)} />
        <DataRow label="Avg Score (Home)" value={stats.avgHomeScore} />
        <DataRow label="Avg Score (Away)" value={stats.avgAwayScore} />
        <DataRow label="Super Bowl Wins" value={stats.superBowlWins} />
        <DataRow label="Super Bowl Appearances" value={stats.superBowlAppearances} />
      </div>
    </InfoPanel>
  );
}

function SeasonTable({ seasons }: { seasons: ConferenceComparisonResult["seasonComparisons"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">AFC Wins</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">NFC Wins</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Ties</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">AFC %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {seasons.map((s) => {
            const total = s.afcWins + s.nflWins + s.ties;
            const afcPct = total > 0 ? (s.afcWins / total).toFixed(3) : ".000";
            return (
              <tr key={s.season} className="transition-colors hover:bg-[#1e2a45]/30">
                <td className="py-2 font-medium text-[#d4af37]">{s.season}</td>
                <td className="py-2 text-center text-[#e0e0e0]">{s.afcWins}</td>
                <td className="py-2 text-center text-[#e0e0e0]">{s.nflWins}</td>
                <td className="py-2 text-center text-[#8899aa]">{s.ties}</td>
                <td className={`py-2 text-center ${pctColor(afcPct)}`}>{afcPct}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ConferenceComparisonDashboard({
  data,
  isLoading,
  isError,
}: ConferenceComparisonDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading conference comparison data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load conference comparison data.</p>
      </div>
    );
  }

  if (!data) return null;

  const totalGames = data.afcStats.totalWins + data.afcStats.totalLosses + data.nflStats.totalWins + data.nflStats.totalLosses;
  const afcHeadToHeadWinPct = totalGames > 0
    ? ((data.afcStats.totalWins / (data.afcStats.totalWins + data.nflStats.totalWins)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Cross-Conf Games" primary={String(data.crossConferenceGames)} />
        <StatBox label="AFC Head-to-Head %" primary={afcHeadToHeadWinPct + "%"} />
        <StatBox label="AFC SB Wins" primary={String(data.superBowlStats.afcWins)} />
        <StatBox label="NFC SB Wins" primary={String(data.superBowlStats.nflWins)} />
      </div>

      {/* AFC vs NFC Comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <ConferencePanel name="AFC" stats={data.afcStats} />
        <ConferencePanel name="NFC" stats={data.nflStats} />
      </div>

      {/* Season-by-season */}
      {data.seasonComparisons.length > 0 && (
        <InfoPanel title="Season-by-Season Conference Head-to-Head">
          <SeasonTable seasons={data.seasonComparisons} />
        </InfoPanel>
      )}

      {/* Super Bowl Summary */}
      <InfoPanel title="Super Bowl Results">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">AFC Super Bowl Wins</p>
            <p className="mt-2 text-3xl font-bold text-[#22c55e]">{data.superBowlStats.afcWins}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">NFC Super Bowl Wins</p>
            <p className="mt-2 text-3xl font-bold text-[#22c55e]">{data.superBowlStats.nflWins}</p>
          </div>
        </div>
      </InfoPanel>
    </div>
  );
}
