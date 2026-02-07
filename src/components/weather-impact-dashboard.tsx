"use client";

import type { WeatherImpactResult, WeatherConditionStats, WindImpactStats } from "@/lib/weather-impact";

interface WeatherImpactDashboardProps {
  data: WeatherImpactResult | null;
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

function ConditionTable({ conditions }: { conditions: WeatherConditionStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Condition</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Home Win %</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Over %</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">Home Cover %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {conditions.map((c) => (
            <tr key={c.condition} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{c.condition}</td>
              <td className="py-2 text-center text-[#8899aa]">{c.games}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{c.avgTotal}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(c.homeWinPct)}`}>{c.homeWinPct}</td>
              <td className={`hidden py-2 text-center sm:table-cell ${pctColor(c.overPct)}`}>{c.overPct}</td>
              <td className={`hidden py-2 text-center md:table-cell ${pctColor(c.homeCoverPct)}`}>{c.homeCoverPct}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WindTable({ wind }: { wind: WindImpactStats }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Wind Category</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home Win %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          <tr className="transition-colors hover:bg-[#1e2a45]/30">
            <td className="py-2 font-medium text-[#e0e0e0]">Low Wind (≤10 mph)</td>
            <td className="py-2 text-center text-[#8899aa]">{wind.lowWind.games}</td>
            <td className="py-2 text-center text-[#e0e0e0]">{wind.lowWind.avgTotal}</td>
            <td className={`py-2 text-center ${pctColor(wind.lowWind.homeWinPct)}`}>{wind.lowWind.homeWinPct}</td>
          </tr>
          <tr className="transition-colors hover:bg-[#1e2a45]/30">
            <td className="py-2 font-medium text-[#e0e0e0]">Moderate Wind (10-15 mph)</td>
            <td className="py-2 text-center text-[#8899aa]">{wind.moderateWind.games}</td>
            <td className="py-2 text-center text-[#e0e0e0]">{wind.moderateWind.avgTotal}</td>
            <td className={`py-2 text-center ${pctColor(wind.moderateWind.homeWinPct)}`}>{wind.moderateWind.homeWinPct}</td>
          </tr>
          <tr className="transition-colors hover:bg-[#1e2a45]/30">
            <td className="py-2 font-medium text-[#e0e0e0]">High Wind ({`>`}15 mph)</td>
            <td className="py-2 text-center text-[#8899aa]">{wind.highWind.games}</td>
            <td className="py-2 text-center text-[#e0e0e0]">{wind.highWind.avgTotal}</td>
            <td className={`py-2 text-center ${pctColor(wind.highWind.homeWinPct)}`}>{wind.highWind.homeWinPct}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function WeatherImpactDashboard({ data, isLoading, isError }: WeatherImpactDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading weather impact data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load weather impact data.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Total Games" primary={String(data.totalGames)} />
        <StatBox label="Dome Advantage" primary={data.domeAdvantage ?? "N/A"} />
        <StatBox label="Outdoor Advantage" primary={data.outdoorAdvantage ?? "N/A"} />
        <StatBox label="Cold Weather Games" primary={String(data.coldWeatherAnalysis.games)} />
      </div>

      {/* Condition stats */}
      {data.conditionStats.length > 0 && (
        <InfoPanel title="Weather Condition Breakdown">
          <ConditionTable conditions={data.conditionStats} />
        </InfoPanel>
      )}

      {/* Cold weather analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoPanel title="Cold Weather Analysis (< 32°F)">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Total Games" value={data.coldWeatherAnalysis.games} />
            <DataRow label="Avg Total Points" value={data.coldWeatherAnalysis.avgTotal} />
            <DataRow
              label="Home Win %"
              value={data.coldWeatherAnalysis.homeWinPct}
              color={pctColor(data.coldWeatherAnalysis.homeWinPct)}
            />
            <DataRow
              label="Over %"
              value={data.coldWeatherAnalysis.overPct}
              color={pctColor(data.coldWeatherAnalysis.overPct, 0.45)}
            />
            <DataRow
              label="Home Cover %"
              value={data.coldWeatherAnalysis.homeCoverPct}
              color={pctColor(data.coldWeatherAnalysis.homeCoverPct)}
            />
          </div>
        </InfoPanel>

        {/* Wind impact */}
        <InfoPanel title="Wind Impact Analysis">
          <div className="text-sm">
            <p className="mb-4 text-[#8899aa]">Games grouped by wind speed categories</p>
            <div className="space-y-2">
              <DataRow label="Low Wind Games" value={data.windImpact.lowWind.games} />
              <DataRow label="Moderate Wind Games" value={data.windImpact.moderateWind.games} />
              <DataRow label="High Wind Games" value={data.windImpact.highWind.games} />
            </div>
          </div>
        </InfoPanel>
      </div>

      {/* Wind table */}
      <InfoPanel title="Wind Speed Breakdown">
        <WindTable wind={data.windImpact} />
      </InfoPanel>
    </div>
  );
}
