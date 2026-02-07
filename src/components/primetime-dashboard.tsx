"use client";

import type { PrimetimeStatsResult } from "@/lib/primetime-stats";

interface PrimetimeDashboardProps {
  data: PrimetimeStatsResult | null;
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

function SlotTable({ slots }: { slots: Array<{ slot: string; totalGames: number; avgHomeScore: string; homeWinPct: string; upsetRate: string; overPct: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Slot</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Score</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Home W%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Upset%</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">Over%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {slots.map((s) => (
            <tr key={s.slot} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{s.slot}</td>
              <td className="py-2 text-center text-[#8899aa]">{s.totalGames}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{s.avgHomeScore}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{(parseFloat(s.homeWinPct) * 100).toFixed(1)}%</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{(parseFloat(s.upsetRate) * 100).toFixed(1)}%</td>
              <td className="hidden py-2 text-center text-[#8899aa] md:table-cell">{(parseFloat(s.overPct) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrimetimeDashboard({ data, isLoading, isError }: PrimetimeDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading primetime stats...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load primetime stats.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Total Slots" primary={String(data.slots.length)} />
        <StatBox label="Best Team" primary={data.bestPrimetimeTeam?.teamName ?? "N/A"} secondary={data.bestPrimetimeTeam?.slot} />
        <StatBox label="Primetime Avg" primary={data.primetimeVsNonPrimetime.primetime.avgTotal} secondary="ppg" />
        <StatBox label="Regular Avg" primary={data.primetimeVsNonPrimetime.nonPrimetime.avgTotal} secondary="ppg" />
      </div>

      {data.slots.length > 0 && (
        <InfoPanel title="Primetime Slot Breakdown">
          <SlotTable slots={data.slots} />
        </InfoPanel>
      )}

      {data.biggestBlowouts.length > 0 && (
        <InfoPanel title="Biggest Primetime Blowouts">
          <div className="space-y-2">
            {data.biggestBlowouts.slice(0, 5).map((b, i) => (
              <DataRow key={i} label={`${b.teams} (${b.slot})`} value={`${b.score} (${b.margin} pts)`} />
            ))}
          </div>
        </InfoPanel>
      )}

      {data.upsets.length > 0 && (
        <InfoPanel title="Primetime Upsets">
          <div className="space-y-2">
            {data.upsets.slice(0, 5).map((u, i) => (
              <DataRow key={i} label={`${u.teams} (${u.season})`} value={`${u.score} (${u.slot})`} />
            ))}
          </div>
        </InfoPanel>
      )}
    </div>
  );
}
