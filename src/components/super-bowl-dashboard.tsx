"use client";

import type { SuperBowlStats } from "@/lib/super-bowl";

interface SuperBowlDashboardProps {
  data: { stats: SuperBowlStats } | null;
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

function ChampionTable({ champions }: { champions: SuperBowlStats["championsByYear"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Champion</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Score</th>
            <th className="hidden py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Runner-Up</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {champions.map((c) => (
            <tr key={c.season} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{c.season}</td>
              <td className="py-2 text-[#e0e0e0]">{c.champion}</td>
              <td className="py-2 text-center text-[#8899aa]">{c.score}</td>
              <td className="hidden py-2 text-[#8899aa] sm:table-cell">{c.opponent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlowoutTable({ blowouts }: { blowouts: SuperBowlStats["biggestBlowouts"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Margin</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Winner</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {blowouts.map((b) => (
            <tr key={`${b.season}-${b.winner}`} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{b.season}</td>
              <td className="py-2 text-center text-[#ef4444] font-bold">{b.margin}</td>
              <td className="py-2 text-[#e0e0e0]">{b.winner}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{b.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClosestTable({ closest }: { closest: SuperBowlStats["closestGames"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Margin</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Winner</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {closest.map((c) => (
            <tr key={`${c.season}-${c.winner}`} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 font-medium text-[#d4af37]">{c.season}</td>
              <td className="py-2 text-center text-[#22c55e] font-bold">{c.margin}</td>
              <td className="py-2 text-[#e0e0e0]">{c.winner}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{c.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AppearanceTable({ appearances }: { appearances: SuperBowlStats["mostAppearances"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Appearances</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Wins</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Losses</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {appearances.map((a) => (
            <tr key={a.team} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 text-[#e0e0e0]">{a.team}</td>
              <td className="py-2 text-center font-medium text-[#d4af37]">{a.count}</td>
              <td className="py-2 text-center text-[#22c55e]">{a.wins}</td>
              <td className="hidden py-2 text-center text-[#ef4444] sm:table-cell">{a.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DynastyTable({ dynasties }: { dynasties: SuperBowlStats["dynastyTracker"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Wins</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Apps</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Win %</th>
            <th className="hidden py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">Era</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {dynasties.map((d) => (
            <tr key={d.team} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2 text-[#e0e0e0]">{d.team}</td>
              <td className="py-2 text-center font-bold text-[#22c55e]">{d.wins}</td>
              <td className="py-2 text-center text-[#d4af37]">{d.appearances}</td>
              <td className="hidden py-2 text-center text-[#8899aa] sm:table-cell">{d.winPct}</td>
              <td className="hidden py-2 text-left text-[#8899aa] lg:table-cell text-xs">{d.era}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SuperBowlDashboard({ data, isLoading, isError }: SuperBowlDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading Super Bowl stats...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load Super Bowl stats.</p>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;

  return (
    <div className="space-y-6">
      {/* Overview stat box */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatBox label="Total Super Bowls" primary={String(stats.totalSuperBowls)} />
        <StatBox label="Most Appearances" primary={stats.mostAppearances[0]?.team ?? "N/A"} secondary={`${stats.mostAppearances[0]?.count ?? 0} times`} />
      </div>

      {/* Champions by year */}
      {stats.championsByYear.length > 0 && (
        <InfoPanel title="Super Bowl Champions">
          <ChampionTable champions={stats.championsByYear} />
        </InfoPanel>
      )}

      {/* Biggest blowouts */}
      {stats.biggestBlowouts.length > 0 && (
        <InfoPanel title="Biggest Blowouts">
          <BlowoutTable blowouts={stats.biggestBlowouts} />
        </InfoPanel>
      )}

      {/* Closest games */}
      {stats.closestGames.length > 0 && (
        <InfoPanel title="Closest Games">
          <ClosestTable closest={stats.closestGames} />
        </InfoPanel>
      )}

      {/* Most appearances */}
      {stats.mostAppearances.length > 0 && (
        <InfoPanel title="Most Super Bowl Appearances">
          <AppearanceTable appearances={stats.mostAppearances} />
        </InfoPanel>
      )}

      {/* Dynasty tracker */}
      {stats.dynastyTracker.length > 0 && (
        <InfoPanel title="Super Bowl Dynasty Tracker">
          <DynastyTable dynasties={stats.dynastyTracker} />
        </InfoPanel>
      )}
    </div>
  );
}
