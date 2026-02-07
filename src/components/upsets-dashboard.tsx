"use client";

import type { UpsetsResult } from "@/lib/upsets";

interface UpsetsProps {
  data: UpsetsResult | null;
  isLoading: boolean;
  isError: boolean;
}

function StatBox({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">{label}</span>
      <span className="mt-1 text-xl font-bold text-[#f0f0f0]">{value}</span>
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

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#8899aa]">{label}</span>
      <span className="text-sm font-medium text-[#e0e0e0]">{value}</span>
    </div>
  );
}

function UpsetTable({
  upsets,
}: {
  upsets: Array<{
    season: number;
    week: string;
    date: string;
    underdogTeam: string;
    favoriteTeam: string;
    score: string;
    spread: number;
    spreadMarginOfVictory: number;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Underdog</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">vs Favorite</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Score</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              Spread
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              Season
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {upsets.map((u, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2.5 font-semibold text-[#22c55e]">{u.underdogTeam}</td>
              <td className="py-2.5 text-[#8899aa]">{u.favoriteTeam}</td>
              <td className="py-2.5 text-center font-mono text-[#d4af37]">{u.score}</td>
              <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">{u.spread.toFixed(1)}</td>
              <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">{u.season}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownTable({
  data,
}: {
  data: Array<{
    [key: string]: string | number;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Category</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Upsets</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Upset Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {data.map((row, idx) => {
            const games = typeof row.games === "number" ? row.games : 0;
            const upsets = typeof row.upsets === "number" ? row.upsets : 0;
            const rate = typeof row.upsetPct === "string" ? parseFloat(row.upsetPct) * 100 : 0;
            const category = row.range || row.slot || row.round || String(row[Object.keys(row)[0]]);

            return (
              <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
                <td className="py-2.5 font-medium text-[#d4af37]">{category}</td>
                <td className="py-2.5 text-center text-[#8899aa]">{games}</td>
                <td className="py-2.5 text-center text-[#d4af37]">{upsets}</td>
                <td className="py-2.5 text-center font-medium text-[#f0f0f0]">{rate.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamTable({
  teams,
}: {
  teams: Array<{ team: string; upsetWins: number; totalWins: number; upsetWinPct: string }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Upset Wins</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Total Wins</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Upset %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {teams.map((t, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2.5 font-medium text-[#d4af37]">{t.team}</td>
              <td className="py-2.5 text-center text-[#22c55e]">{t.upsetWins}</td>
              <td className="py-2.5 text-center text-[#e0e0e0]">{t.totalWins}</td>
              <td className="py-2.5 text-center font-medium text-[#e0e0e0]">{t.upsetWinPct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StreakTable({
  streaks,
}: {
  streaks: Array<{
    team: string;
    streakLength: number;
    startDate: string;
    endDate: string;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Upset Wins</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              Last Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {streaks.map((s, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2.5 font-medium text-[#d4af37]">{s.team}</td>
              <td className="py-2.5 text-center text-[#22c55e]">{s.streakLength}</td>
              <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">
                {new Date(s.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UpsettsDashboard({ data, isLoading, isError }: UpsetsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading upsets data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load upsets data.</p>
      </div>
    );
  }

  if (!data) return null;

  const overallUpsetPct = parseFloat(data.overallUpsetRate) * 100;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Overall Upset Rate" value={overallUpsetPct.toFixed(1) + "%"} secondary="all games" />
        <StatBox label="Total Upsets" value={String(data.biggestUpsets.length)} secondary="in database" />
        {data.mostCommonUpsettingTeams.length > 0 && (
          <StatBox
            label="Most Upset-Prone"
            value={data.mostCommonUpsettingTeams[0].upsetWins.toString()}
            secondary={data.mostCommonUpsettingTeams[0].team}
          />
        )}
      </div>

      {/* Biggest upsets */}
      {data.biggestUpsets.length > 0 && (
        <InfoPanel title="Biggest Upsets (by Margin vs Spread)">
          <UpsetTable upsets={data.biggestUpsets} />
        </InfoPanel>
      )}

      {/* Upset rate by spread range */}
      {data.upsetRateBySpreadRange.length > 0 && (
        <InfoPanel title="Upset Rate by Spread Range">
          <BreakdownTable data={data.upsetRateBySpreadRange} />
        </InfoPanel>
      )}

      {/* Upset rate by primetime */}
      {data.upsetRateByPrimetime.length > 0 && (
        <InfoPanel title="Upset Rate by Primetime Slot">
          <BreakdownTable data={data.upsetRateByPrimetime} />
        </InfoPanel>
      )}

      {/* Upset rate by playoff round */}
      {data.upsetRateByPlayoffRound.length > 0 && (
        <InfoPanel title="Upset Rate by Playoff Round">
          <BreakdownTable data={data.upsetRateByPlayoffRound} />
        </InfoPanel>
      )}

      {/* Most common upsetting teams */}
      {data.mostCommonUpsettingTeams.length > 0 && (
        <InfoPanel title="Most Common Upsetting Teams">
          <TeamTable teams={data.mostCommonUpsettingTeams} />
        </InfoPanel>
      )}

      {/* Longest upset win streaks */}
      {data.longestUpsetsWinStreaks.length > 0 && (
        <InfoPanel title="Most Upset Wins (Active)">
          <StreakTable streaks={data.longestUpsetsWinStreaks} />
        </InfoPanel>
      )}

      {/* Season trend */}
      {data.upsetRateBySeasonTrend.length > 0 && (
        <InfoPanel title="Upset Rate by Season">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a45]">
                  <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Year</th>
                  <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                    Upset Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a45]/50">
                {data.upsetRateBySeasonTrend.map((s) => (
                  <tr key={s.season} className="transition-colors hover:bg-[#1e2a45]/30">
                    <td className="py-2 font-medium text-[#e0e0e0]">{s.season}</td>
                    <td className="py-2 text-center font-medium text-[#d4af37]">
                      {(parseFloat(s.upsetPct) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoPanel>
      )}
    </div>
  );
}
