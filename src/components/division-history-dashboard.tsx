"use client";

import type { DivisionHistoryResult } from "@/lib/division-history";

interface DivisionHistoryDashboardProps {
  data: DivisionHistoryResult | null;
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

function DominanceTable({ teams }: { teams: Array<{ teamName: string; division: string; titles: number; seasons: string }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Division</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Titles</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Span</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {teams.map((t) => (
            <tr key={`${t.teamName}-${t.division}`} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 text-[#d4af37]">{t.teamName}</td>
              <td className="py-2 text-center text-[#8899aa]">{t.division}</td>
              <td className="py-2 text-center text-[#e0e0e0]">{t.titles}</td>
              <td className="py-2 text-center text-[#8899aa]">{t.seasons}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DivisionHistoryDashboard({ data, isLoading, isError }: DivisionHistoryDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading division history...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load division history.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Total Winners" primary={String(data.divisionWinners.length)} />
        <StatBox label="Top Franchise" primary={data.divisionDominance[0]?.teamName ?? "N/A"} secondary={`${data.divisionDominance[0]?.titles ?? 0} titles`} />
        <StatBox label="Most Competitive" primary={data.mostCompetitiveDivisions[0]?.division ?? "N/A"} />
        <StatBox label="Teams Tracked" primary={String(new Set(data.intraDivisionRecords.map((r) => r.teamName)).size)} />
      </div>

      {data.divisionDominance.length > 0 && (
        <InfoPanel title="Division Dominance Rankings">
          <DominanceTable teams={data.divisionDominance.slice(0, 10)} />
        </InfoPanel>
      )}

      {data.intraDivisionRecords.length > 0 && (
        <InfoPanel title="Top Intra-Division Records">
          <div className="space-y-2">
            {data.intraDivisionRecords.slice(0, 10).map((r, i) => (
              <DataRow
                key={i}
                label={`${r.teamName} (${r.division})`}
                value={`${r.wins}-${r.losses}${r.ties > 0 ? `-${r.ties}` : ""} (${r.pct})`}
              />
            ))}
          </div>
        </InfoPanel>
      )}

      {data.mostCompetitiveDivisions.length > 0 && (
        <InfoPanel title="Most Competitive Divisions">
          <div className="space-y-2">
            {data.mostCompetitiveDivisions.slice(0, 5).map((d, i) => (
              <DataRow key={i} label={`${d.division} (${d.season})`} value={`Spread: ${d.spread}`} />
            ))}
          </div>
        </InfoPanel>
      )}
    </div>
  );
}
