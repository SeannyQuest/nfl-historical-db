"use client";

import { useRouter } from "next/navigation";
import type { StandingsResult, DivisionStandings } from "@/lib/standings";

interface StandingsDashboardProps {
  standings: StandingsResult | null;
  isLoading: boolean;
  isError: boolean;
}

function DivisionTable({ div }: { div: DivisionStandings }) {
  const router = useRouter();

  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
      <div className="border-b border-[#1e2a45] px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">
          {div.conference} {div.division}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e2a45]">
              <th className="py-2 pl-5 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
              <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">W</th>
              <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">L</th>
              <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">T</th>
              <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">PCT</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">PF</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">PA</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">DIFF</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">HOME</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">AWAY</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">DIV</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">CONF</th>
              <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">STRK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2a45]/50">
            {div.teams.map((s, idx) => {
              const diffColor =
                s.pointDiff > 0
                  ? "text-[#22c55e]"
                  : s.pointDiff < 0
                    ? "text-[#ef4444]"
                    : "text-[#8899aa]";
              const diffStr = s.pointDiff > 0 ? `+${s.pointDiff}` : String(s.pointDiff);

              return (
                <tr
                  key={s.team.name}
                  onClick={() => router.push(`/teams/${encodeURIComponent(s.team.name)}`)}
                  className="cursor-pointer transition-colors hover:bg-[#1e2a45]/30"
                >
                  <td className="py-2.5 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center text-xs text-[#5a6a7a]">{idx + 1}</span>
                      <span className="font-semibold text-[#d4af37]">{s.team.abbreviation}</span>
                      <span className="hidden text-[#8899aa] sm:inline">{s.team.nickname}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center text-[#e0e0e0]">{s.wins}</td>
                  <td className="py-2.5 text-center text-[#e0e0e0]">{s.losses}</td>
                  <td className="py-2.5 text-center text-[#8899aa]">{s.ties}</td>
                  <td className="py-2.5 text-center font-medium text-[#e0e0e0]">{s.pct}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">{s.pointsFor}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">{s.pointsAgainst}</td>
                  <td className={`hidden py-2.5 text-center font-medium sm:table-cell ${diffColor}`}>{diffStr}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">{s.homeRecord}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">{s.awayRecord}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] lg:table-cell">{s.divRecord}</td>
                  <td className="hidden py-2.5 text-center text-[#8899aa] lg:table-cell">{s.confRecord}</td>
                  <td className={`hidden py-2.5 text-center lg:table-cell ${
                    s.streak.startsWith("W") ? "text-[#22c55e]" : s.streak.startsWith("L") ? "text-[#ef4444]" : "text-[#8899aa]"
                  }`}>{s.streak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StandingsDashboard({ standings, isLoading, isError }: StandingsDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading standings...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load standings.</p>
      </div>
    );
  }

  if (!standings) return null;

  // Group divisions by conference
  const afcDivisions = standings.divisions.filter((d) => d.conference === "AFC");
  const nfcDivisions = standings.divisions.filter((d) => d.conference === "NFC");

  return (
    <div className="space-y-8">
      {/* AFC */}
      {afcDivisions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#e0e0e0]">AFC</h2>
          <div className="space-y-4">
            {afcDivisions.map((div) => (
              <DivisionTable key={`${div.conference}-${div.division}`} div={div} />
            ))}
          </div>
        </div>
      )}

      {/* NFC */}
      {nfcDivisions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-[#e0e0e0]">NFC</h2>
          <div className="space-y-4">
            {nfcDivisions.map((div) => (
              <DivisionTable key={`${div.conference}-${div.division}`} div={div} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
