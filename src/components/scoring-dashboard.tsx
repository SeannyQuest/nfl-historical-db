"use client";

import type { ScoringDistributionResult } from "@/lib/scoring-distribution";

interface ScoringDashboardProps {
  analysis: ScoringDistributionResult | null;
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

function StatBox({ label, primary, secondary }: { label: string; primary: string; secondary?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">{label}</span>
      <span className="mt-1 text-xl font-bold text-[#f0f0f0]">{primary}</span>
      {secondary && <span className="mt-0.5 text-xs text-[#8899aa]">{secondary}</span>}
    </div>
  );
}

function BarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number; percentage: string }[];
  maxValue: number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-16 text-right text-xs font-medium text-[#8899aa]">{item.label}</div>
          <div className="flex-1">
            <div className="relative h-6 overflow-hidden rounded-sm bg-[#0d1321]">
              <div
                className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8941e] transition-all duration-300"
                style={{
                  width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
          <div className="w-20 text-right">
            <div className="text-xs font-bold text-[#e0e0e0]">{item.value}</div>
            <div className="text-xs text-[#8899aa]">{item.percentage}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreDistributionChart({
  buckets,
}: {
  buckets: { label: string; count: number; percentage: string }[];
}) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <BarChart
      data={buckets.map((b) => ({
        label: b.label,
        value: b.count,
        percentage: b.percentage,
      }))}
      maxValue={maxCount}
    />
  );
}

function EraTable({
  eras,
}: {
  eras: {
    era: string;
    decade: number;
    games: number;
    avgTotal: string;
    avgHome: string;
    avgAway: string;
    highestGame: number;
    lowestGame: number;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Era</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Home Avg</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Away Avg</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">Range</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {eras.map((era) => (
            <tr key={era.decade} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{era.era}</td>
              <td className="py-2 text-center text-[#8899aa]">{era.games}</td>
              <td className="py-2 text-center font-medium text-[#e0e0e0]">{era.avgTotal}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{era.avgHome}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{era.avgAway}</td>
              <td className="hidden py-2 text-center text-xs text-[#8899aa] md:table-cell">
                {era.lowestGame}-{era.highestGame}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DayOfWeekTable({
  days,
}: {
  days: {
    day: string;
    games: number;
    avgTotal: string;
    avgHome: string;
    avgAway: string;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Day</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Home</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Away</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {days.map((day) => (
            <tr key={day.day} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#e0e0e0]">{day.day}</td>
              <td className="py-2 text-center text-[#8899aa]">{day.games}</td>
              <td className="py-2 text-center font-medium text-[#d4af37]">{day.avgTotal}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{day.avgHome}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{day.avgAway}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PrimetimeComparison({
  primetime,
  regular,
}: {
  primetime: {
    label: string;
    games: number;
    avgTotal: string;
    avgHome: string;
    avgAway: string;
  };
  regular: {
    label: string;
    games: number;
    avgTotal: string;
    avgHome: string;
    avgAway: string;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#d4af37]">Primetime</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Games</span>
            <span className="font-medium text-[#e0e0e0]">{primetime.games}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Total</span>
            <span className="font-medium text-[#e0e0e0]">{primetime.avgTotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Home</span>
            <span className="font-medium text-[#e0e0e0]">{primetime.avgHome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Away</span>
            <span className="font-medium text-[#e0e0e0]">{primetime.avgAway}</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#8899aa]">Regular Season</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Games</span>
            <span className="font-medium text-[#e0e0e0]">{regular.games}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Total</span>
            <span className="font-medium text-[#e0e0e0]">{regular.avgTotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Home</span>
            <span className="font-medium text-[#e0e0e0]">{regular.avgHome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#8899aa]">Avg Away</span>
            <span className="font-medium text-[#e0e0e0]">{regular.avgAway}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoringDashboard({ analysis, isLoading, isError }: ScoringDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading scoring analysis...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load scoring analysis.</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatBox label="Total Games" primary={String(analysis.totalGames)} />
        <StatBox label="Avg Total" primary={analysis.overallAvgTotal} secondary="points" />
        <StatBox
          label="Most Common Range"
          primary={
            analysis.scoreDistribution.reduce((prev, curr) =>
              curr.count > prev.count ? curr : prev
            ).label
          }
          secondary="score bucket"
        />
        <StatBox
          label="Avg Margin"
          primary={
            (
              analysis.marginDistribution.reduce((sum, b) => sum + b.count * (b.min + b.max) / 2, 0) /
              analysis.totalGames
            ).toFixed(1)
          }
          secondary="points"
        />
        <StatBox label="Primetime Games" primary={String(analysis.primetimeComparison.primetime.games)} />
      </div>

      {/* Score distribution */}
      {analysis.scoreDistribution.length > 0 && (
        <InfoPanel title="Score Distribution">
          <p className="mb-4 text-xs text-[#8899aa]">Total points per game across all games</p>
          <ScoreDistributionChart buckets={analysis.scoreDistribution} />
        </InfoPanel>
      )}

      {/* Margin distribution */}
      {analysis.marginDistribution.length > 0 && (
        <InfoPanel title="Margin of Victory Distribution">
          <p className="mb-4 text-xs text-[#8899aa]">Winning margin across all games</p>
          <ScoreDistributionChart buckets={analysis.marginDistribution} />
        </InfoPanel>
      )}

      {/* Era comparison */}
      {analysis.byEra.length > 0 && (
        <InfoPanel title="Scoring by Era">
          <p className="mb-4 text-xs text-[#8899aa]">Decade-by-decade scoring trends</p>
          <EraTable eras={analysis.byEra} />
        </InfoPanel>
      )}

      {/* Day of week */}
      {analysis.byDayOfWeek.length > 0 && (
        <InfoPanel title="Scoring by Day of Week">
          <p className="mb-4 text-xs text-[#8899aa]">Average scoring by day of week</p>
          <DayOfWeekTable days={analysis.byDayOfWeek} />
        </InfoPanel>
      )}

      {/* Primetime vs regular */}
      <InfoPanel title="Primetime vs Regular Season">
        <p className="mb-4 text-xs text-[#8899aa]">Scoring comparison between primetime and regular games</p>
        <PrimetimeComparison
          primetime={analysis.primetimeComparison.primetime}
          regular={analysis.primetimeComparison.regular}
        />
      </InfoPanel>
    </div>
  );
}
