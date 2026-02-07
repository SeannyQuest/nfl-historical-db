"use client";

import type { FranchiseHistoryResult, FranchiseStats } from "@/lib/franchise-history";

interface FranchiseHistoryDashboardProps {
  data: FranchiseHistoryResult | null;
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

function FranchiseTable({ franchises }: { franchises: FranchiseStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Franchise</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">W-L-T</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win %</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">SB Wins</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Names</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {franchises.map((f) => (
            <tr key={f.franchiseKey} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{f.franchiseName}</td>
              <td className="py-2 text-center text-[#e0e0e0]">
                {f.totalWins}-{f.totalLosses}-{f.totalTies}
              </td>
              <td className="py-2 text-center text-[#22c55e]">{f.winPct}</td>
              <td className="hidden py-2 text-center text-[#e0e0e0] sm:table-cell">{f.superBowlWins}</td>
              <td className="hidden py-2 text-center text-xs text-[#8899aa] sm:table-cell">
                {f.allNames.length} name(s)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FranchiseDetail({ franchise }: { franchise: FranchiseStats }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-lg font-bold text-[#d4af37]">{franchise.franchiseName}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Record</p>
            <p className="mt-1 text-lg font-bold text-[#e0e0e0]">
              {franchise.totalWins}-{franchise.totalLosses}-{franchise.totalTies}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Win %</p>
            <p className="mt-1 text-lg font-bold text-[#22c55e]">{franchise.winPct}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Super Bowl Wins</p>
            <p className="mt-1 text-lg font-bold text-[#f0f0f0]">{franchise.superBowlWins}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Appearances</p>
            <p className="mt-1 text-lg font-bold text-[#f0f0f0]">{franchise.superBowlAppearances}</p>
          </div>
        </div>
      </div>

      {franchise.allNames.length > 1 && (
        <div className="border-t border-[#1e2a45] pt-4">
          <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Historical Names</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {franchise.allNames.map((name) => (
              <span key={name} className="rounded bg-[#1e2a45] px-2 py-1 text-xs text-[#8899aa]">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {franchise.bestSeason && (
        <div className="border-t border-[#1e2a45] pt-4">
          <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Best Season</p>
          <p className="mt-1 text-[#e0e0e0]">
            {franchise.bestSeason.season}: {franchise.bestSeason.wins}-{franchise.bestSeason.losses}-{franchise.bestSeason.ties}
          </p>
        </div>
      )}

      {franchise.worstSeason && (
        <div className="border-t border-[#1e2a45] pt-4">
          <p className="text-xs uppercase tracking-wider text-[#5a6a7a]">Worst Season</p>
          <p className="mt-1 text-[#e0e0e0]">
            {franchise.worstSeason.season}: {franchise.worstSeason.wins}-{franchise.worstSeason.losses}-{franchise.worstSeason.ties}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FranchiseHistoryDashboard({ data, isLoading, isError }: FranchiseHistoryDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading franchise history data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load franchise history data.</p>
      </div>
    );
  }

  if (!data) return null;

  const totalWins = data.franchises.reduce((sum, f) => sum + f.totalWins, 0);
  const totalGames = data.franchises.reduce((sum, f) => sum + f.totalWins + f.totalLosses + f.totalTies, 0);

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatBox label="Total Franchises" primary={String(data.totalFranchises)} />
        <StatBox label="Total Games" primary={String(totalGames)} />
        <StatBox label="Total Wins" primary={String(totalWins)} />
        <StatBox label="Top Franchise" primary={data.franchises[0]?.franchiseName.split(" ").pop() ?? "—"} />
      </div>

      {/* Franchise table */}
      {data.franchises.length > 0 && (
        <InfoPanel title="Franchise Records">
          <FranchiseTable franchises={data.franchises} />
        </InfoPanel>
      )}

      {/* Top franchises detail */}
      {data.franchises.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.franchises.slice(0, 3).map((f) => (
            <InfoPanel key={f.franchiseKey} title={f.franchiseName}>
              <FranchiseDetail franchise={f} />
            </InfoPanel>
          ))}
        </div>
      )}
    </div>
  );
}
