"use client";

import type { HomeAdvantageResult } from "@/lib/home-advantage";

interface HomeAdvantageProps {
  data: HomeAdvantageResult | null;
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

function DataRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#8899aa]">{label}</span>
      <span className={`text-sm font-medium ${color ?? "text-[#e0e0e0]"}`}>{value}</span>
    </div>
  );
}

function pctColor(value: string): string {
  const num = parseFloat(value.replace("%", ""));
  if (num > 55) return "text-[#22c55e]";
  if (num < 45) return "text-[#ef4444]";
  return "text-[#d4af37]";
}

function DecimalPctColor(value: string): string {
  const num = parseFloat(value);
  if (num > 0.55) return "text-[#22c55e]";
  if (num < 0.45) return "text-[#ef4444]";
  return "text-[#d4af37]";
}

function SeasonTable({ seasons }: { seasons: Array<{ season: number; homeWinPct: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Year</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {seasons.map((s) => (
            <tr key={s.season} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#e0e0e0]">{s.season}</td>
              <td className={`py-2 text-center font-medium ${DecimalPctColor(s.homeWinPct)}`}>
                {(parseFloat(s.homeWinPct) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownTable({
  data,
  keyField,
  gameCountField,
}: {
  data: Array<{ [key: string]: string | number }>;
  keyField: string;
  gameCountField?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">{keyField}</th>
            {gameCountField && (
              <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            )}
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {data.map((row, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{String(row[keyField])}</td>
              {gameCountField && <td className="py-2 text-center text-[#8899aa]">{row[gameCountField]}</td>}
              <td className={`py-2 text-center font-medium ${DecimalPctColor(String(row.homeWinPct))}`}>
                {(parseFloat(String(row.homeWinPct)) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamTable({
  teams,
  title,
}: {
  teams: Array<{ team: string; homeWins: number; homeLosses: number; homeWinPct: string }>;
  title: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home Record</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {teams.map((t, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{t.team}</td>
              <td className="py-2 text-center text-[#e0e0e0]">
                {t.homeWins}-{t.homeLosses}
              </td>
              <td className={`py-2 text-center font-medium ${pctColor(t.homeWinPct)}`}>{t.homeWinPct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HomeAdvantageDashboard({ data, isLoading, isError }: HomeAdvantageProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading home advantage data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load home advantage data.</p>
      </div>
    );
  }

  if (!data) return null;

  const overallHomeWinPct = parseFloat(data.overallHomeWinRate) * 100;
  const homeCoverPct = parseFloat(data.homeCoverRate) * 100;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Home Win %" value={overallHomeWinPct.toFixed(1) + "%"} secondary="all games" />
        <StatBox label="Home Cover %" value={homeCoverPct.toFixed(1) + "%"} secondary="when spread exists" />
        <StatBox label="Scoring Advantage" value={data.homeScoringAdvantage} secondary="points per game" />
        <StatBox
          label="Playoff vs Regular"
          value={data.playoffVsRegularHomeWinRate.regular}
          secondary="regular season"
        />
      </div>

      {/* Playoff vs Regular comparison */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel title="Regular Season Home Advantage">
          <DataRow
            label="Home Win %"
            value={`${(parseFloat(data.playoffVsRegularHomeWinRate.regular) * 100).toFixed(1)}%`}
            color={DecimalPctColor(data.playoffVsRegularHomeWinRate.regular)}
          />
        </InfoPanel>
        <InfoPanel title="Playoff Home Advantage">
          <DataRow
            label="Home Win %"
            value={`${(parseFloat(data.playoffVsRegularHomeWinRate.playoff) * 100).toFixed(1)}%`}
            color={DecimalPctColor(data.playoffVsRegularHomeWinRate.playoff)}
          />
        </InfoPanel>
      </div>

      {/* Dome vs Outdoor */}
      {(data.domeVsOutdoorAdvantage.dome || data.domeVsOutdoorAdvantage.outdoor) && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.domeVsOutdoorAdvantage.dome && (
            <InfoPanel title="Dome Home Advantage">
              <DataRow label="Home Win %" value={data.domeVsOutdoorAdvantage.dome} />
            </InfoPanel>
          )}
          {data.domeVsOutdoorAdvantage.outdoor && (
            <InfoPanel title="Outdoor Home Advantage">
              <DataRow label="Home Win %" value={data.domeVsOutdoorAdvantage.outdoor} />
            </InfoPanel>
          )}
        </div>
      )}

      {/* Day of week breakdown */}
      {data.homeWinRateByDayOfWeek.length > 0 && (
        <InfoPanel title="Home Advantage by Day of Week">
          <BreakdownTable data={data.homeWinRateByDayOfWeek} keyField="day" gameCountField="games" />
        </InfoPanel>
      )}

      {/* Primetime breakdown */}
      {data.homeWinRateByPrimetime.length > 0 && (
        <InfoPanel title="Home Advantage by Primetime Slot">
          <BreakdownTable data={data.homeWinRateByPrimetime} keyField="slot" gameCountField="games" />
        </InfoPanel>
      )}

      {/* Season trend */}
      {data.homeWinRateBySeasonTrend.length > 0 && (
        <InfoPanel title="Home Win % by Season">
          <SeasonTable seasons={data.homeWinRateBySeasonTrend} />
        </InfoPanel>
      )}

      {/* Best home teams */}
      {data.bestHomeTeams.length > 0 && (
        <InfoPanel title="Best Home Teams">
          <TeamTable teams={data.bestHomeTeams} title="Best Home Teams" />
        </InfoPanel>
      )}

      {/* Worst home teams */}
      {data.worstHomeTeams.length > 0 && (
        <InfoPanel title="Worst Home Teams">
          <TeamTable teams={data.worstHomeTeams} title="Worst Home Teams" />
        </InfoPanel>
      )}
    </div>
  );
}
