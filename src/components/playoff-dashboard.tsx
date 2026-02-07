"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PlayoffStatsResult,
  TeamPlayoffRecord,
  SuperBowlEntry,
  PlayoffSeasonSummary,
} from "@/lib/playoff-stats";

interface PlayoffDashboardProps {
  stats: PlayoffStatsResult | null;
  isLoading: boolean;
  isError: boolean;
}

type Tab = "teams" | "superBowls" | "seasons";

const TABS: { key: Tab; label: string }[] = [
  { key: "teams", label: "Team Records" },
  { key: "superBowls", label: "Super Bowl History" },
  { key: "seasons", label: "By Season" },
];

// ─── Stat box ───────────────────────────────────────────

function StatBox({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-[#f0f0f0]">{value}</div>
      {detail && (
        <div className="mt-0.5 text-xs text-[#5a6a7a]">{detail}</div>
      )}
    </div>
  );
}

// ─── Team records table ─────────────────────────────────

function TeamRecordsTable({ records }: { records: TeamPlayoffRecord[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Team
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              W-L
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Win%
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              SB
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              Conf
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              Div
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              WC
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">
              Seasons
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {records.map((team) => (
            <tr
              key={team.teamName}
              onClick={() =>
                router.push(
                  `/teams/${encodeURIComponent(team.teamName)}`
                )
              }
              className="cursor-pointer transition-colors hover:bg-[#1e2a45]/30"
            >
              <td className="py-2.5">
                <span className="font-bold text-[#d4af37]">
                  {team.teamAbbr}
                </span>
                <span className="ml-2 hidden text-[#8899aa] sm:inline">
                  {team.teamName}
                </span>
              </td>
              <td className="py-2.5 text-center font-mono text-[#e0e0e0]">
                {team.totalWins}-{team.totalLosses}
              </td>
              <td className="py-2.5 text-center font-mono text-[#e0e0e0]">
                {team.winPct}
              </td>
              <td className="py-2.5 text-center">
                {team.superBowlWins > 0 ? (
                  <span className="font-bold text-[#d4af37]">
                    {team.superBowlWins}
                    {team.superBowlLosses > 0 && (
                      <span className="font-normal text-[#5a6a7a]">
                        -{team.superBowlLosses}
                      </span>
                    )}
                  </span>
                ) : team.superBowlAppearances > 0 ? (
                  <span className="text-[#8899aa]">
                    0-{team.superBowlLosses}
                  </span>
                ) : (
                  <span className="text-[#5a6a7a]">--</span>
                )}
              </td>
              <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">
                {team.confChampWins}-{team.confChampLosses}
              </td>
              <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">
                {team.divRoundWins}-{team.divRoundLosses}
              </td>
              <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">
                {team.wildCardWins}-{team.wildCardLosses}
              </td>
              <td className="hidden py-2.5 text-center text-[#8899aa] lg:table-cell">
                {team.playoffSeasons}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Super Bowl history table ───────────────────────────

function SuperBowlTable({ history }: { history: SuperBowlEntry[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Season
            </th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Champion
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Score
            </th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Runner-Up
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {history.map((sb) => (
            <tr
              key={sb.season}
              onClick={() => router.push(`/games/${sb.gameId}`)}
              className="cursor-pointer transition-colors hover:bg-[#1e2a45]/30"
            >
              <td className="py-2.5 font-mono text-[#e0e0e0]">
                {sb.season}
              </td>
              <td className="py-2.5">
                <span className="font-bold text-[#d4af37]">
                  {sb.winnerAbbr}
                </span>
                <span className="ml-2 hidden text-[#8899aa] sm:inline">
                  {sb.winnerName}
                </span>
              </td>
              <td className="py-2.5 text-center font-mono">
                <span className="font-bold text-[#f0f0f0]">
                  {sb.winnerScore}
                </span>
                <span className="mx-1 text-[#5a6a7a]">-</span>
                <span className="text-[#8899aa]">{sb.loserScore}</span>
              </td>
              <td className="py-2.5">
                <span className="font-semibold text-[#8899aa]">
                  {sb.loserAbbr}
                </span>
                <span className="ml-2 hidden text-[#5a6a7a] sm:inline">
                  {sb.loserName}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Season summaries table ─────────────────────────────

function SeasonSummaryTable({
  summaries,
}: {
  summaries: PlayoffSeasonSummary[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Season
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Games
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Avg Total
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              High
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              Low
            </th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              Home-Away
            </th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Champion
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {summaries.map((s) => (
            <tr key={s.season}>
              <td className="py-2.5 font-mono text-[#e0e0e0]">{s.season}</td>
              <td className="py-2.5 text-center text-[#8899aa]">
                {s.totalGames}
              </td>
              <td className="py-2.5 text-center font-mono text-[#e0e0e0]">
                {s.avgTotal}
              </td>
              <td className="hidden py-2.5 text-center font-mono text-[#8899aa] sm:table-cell">
                {s.highestTotal}
              </td>
              <td className="hidden py-2.5 text-center font-mono text-[#8899aa] sm:table-cell">
                {s.lowestTotal}
              </td>
              <td className="hidden py-2.5 text-center text-[#8899aa] md:table-cell">
                {s.homeWins}-{s.awayWins}
              </td>
              <td className="py-2.5">
                {s.superBowlWinnerAbbr ? (
                  <span className="font-bold text-[#d4af37]">
                    {s.superBowlWinnerAbbr}
                  </span>
                ) : (
                  <span className="text-[#5a6a7a]">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────

export default function PlayoffDashboard({
  stats,
  isLoading,
  isError,
}: PlayoffDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("teams");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading playoff stats...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load playoff stats.</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview stat boxes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label="Playoff Games"
          value={stats.totals.totalGames.toLocaleString()}
          detail={`${stats.totals.totalSeasons} seasons`}
        />
        <StatBox
          label="Avg Total Points"
          value={stats.totals.avgTotal}
        />
        <StatBox
          label="Home Win %"
          value={stats.totals.homeWinPct}
        />
        <StatBox
          label="Super Bowls"
          value={stats.superBowlHistory.length}
          detail={
            stats.superBowlHistory.length > 0
              ? `Latest: ${stats.superBowlHistory[0].winnerAbbr} (${stats.superBowlHistory[0].season})`
              : undefined
          }
        />
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-[#1e2a45] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#d4af37] text-[#d4af37]"
                : "text-[#8899aa] hover:text-[#e0e0e0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
        <div className="px-5 py-4">
          {activeTab === "teams" && (
            <TeamRecordsTable records={stats.teamRecords} />
          )}
          {activeTab === "superBowls" && (
            <SuperBowlTable history={stats.superBowlHistory} />
          )}
          {activeTab === "seasons" && (
            <SeasonSummaryTable summaries={stats.seasonSummaries} />
          )}
        </div>
      </div>
    </div>
  );
}
