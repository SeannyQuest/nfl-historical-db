"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RecordsResult, RecordEntry, TeamSeasonEntry } from "@/lib/records";

interface RecordsDashboardProps {
  records: RecordsResult | null;
  isLoading: boolean;
  isError: boolean;
}

type Category =
  | "highestScoringGames"
  | "lowestScoringGames"
  | "biggestBlowouts"
  | "closestGames"
  | "highestHomeScores"
  | "highestAwayScores"
  | "bestTeamSeasons"
  | "worstTeamSeasons";

const CATEGORIES: { key: Category; label: string; group: "games" | "teams" }[] = [
  { key: "highestScoringGames", label: "Highest Scoring", group: "games" },
  { key: "lowestScoringGames", label: "Lowest Scoring", group: "games" },
  { key: "biggestBlowouts", label: "Biggest Blowouts", group: "games" },
  { key: "closestGames", label: "Closest Games", group: "games" },
  { key: "highestHomeScores", label: "Best Home Scores", group: "games" },
  { key: "highestAwayScores", label: "Best Away Scores", group: "games" },
  { key: "bestTeamSeasons", label: "Best Seasons", group: "teams" },
  { key: "worstTeamSeasons", label: "Worst Seasons", group: "teams" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function GameRecordTable({ entries }: { entries: RecordEntry[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">#</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Matchup</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Score</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Value</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Season</th>
            <th className="hidden py-2 text-right text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {entries.map((entry) => {
            const g = entry.game;
            const homeWon = g.homeScore > g.awayScore;
            const awayWon = g.awayScore > g.homeScore;

            return (
              <tr
                key={`${g.id}-${entry.rank}`}
                onClick={() => router.push(`/games/${g.id}`)}
                className="cursor-pointer transition-colors hover:bg-[#1e2a45]/30"
              >
                <td className="py-2.5 text-[#d4af37] font-bold">{entry.rank}</td>
                <td className="py-2.5">
                  <span className={awayWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                    {g.awayTeamAbbr}
                  </span>
                  <span className="mx-1.5 text-[#5a6a7a]">@</span>
                  <span className={homeWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                    {g.homeTeamAbbr}
                  </span>
                  {g.isPlayoff && (
                    <span className="ml-2 rounded bg-[#d4af37]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#d4af37]">
                      {g.week}
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-center font-mono">
                  <span className={awayWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"}>
                    {g.awayScore}
                  </span>
                  <span className="mx-1 text-[#5a6a7a]">-</span>
                  <span className={homeWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"}>
                    {g.homeScore}
                  </span>
                </td>
                <td className="py-2.5 text-center font-bold text-[#d4af37]">{entry.value}</td>
                <td className="hidden py-2.5 text-center text-[#8899aa] sm:table-cell">{g.season}</td>
                <td className="hidden py-2.5 text-right text-[#8899aa] md:table-cell">{formatDate(g.date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamSeasonTable({ entries }: { entries: TeamSeasonEntry[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">#</th>
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Team</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Season</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Record</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {entries.map((entry) => (
            <tr
              key={`${entry.teamName}-${entry.season}-${entry.rank}`}
              onClick={() => router.push(`/teams/${encodeURIComponent(entry.teamName)}`)}
              className="cursor-pointer transition-colors hover:bg-[#1e2a45]/30"
            >
              <td className="py-2.5 font-bold text-[#d4af37]">{entry.rank}</td>
              <td className="py-2.5">
                <span className="font-semibold text-[#d4af37]">{entry.teamAbbr}</span>
                <span className="ml-2 hidden text-[#8899aa] sm:inline">{entry.teamName}</span>
              </td>
              <td className="py-2.5 text-center text-[#e0e0e0]">{entry.season}</td>
              <td className="py-2.5 text-center text-[#e0e0e0]">{entry.detail}</td>
              <td className="py-2.5 text-center font-medium text-[#e0e0e0]">{entry.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecordsDashboard({ records, isLoading, isError }: RecordsDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<Category>("highestScoringGames");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading records...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load records.</p>
      </div>
    );
  }

  if (!records) return null;

  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;
  const isTeamCategory = activeCat.group === "teams";

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? "bg-[#d4af37] text-[#0a0f1a]"
                : "border border-[#2a3a55] text-[#8899aa] hover:border-[#d4af37] hover:text-[#d4af37]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Records table */}
      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
        <div className="border-b border-[#1e2a45] px-5 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">
            {activeCat.label}
          </h3>
        </div>
        <div className="px-5 py-4">
          {isTeamCategory ? (
            <TeamSeasonTable entries={records[activeCategory] as TeamSeasonEntry[]} />
          ) : (
            <GameRecordTable entries={records[activeCategory] as RecordEntry[]} />
          )}
          {(records[activeCategory] as unknown[]).length === 0 && (
            <p className="py-8 text-center text-sm text-[#5a6a7a]">No records found</p>
          )}
        </div>
      </div>
    </div>
  );
}
