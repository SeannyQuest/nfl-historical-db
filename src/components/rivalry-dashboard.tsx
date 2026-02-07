"use client";

import { useState } from "react";
import type { RivalriesResult, RivalryEntry } from "@/lib/rivalry";

interface RivalryProps {
  data: RivalriesResult | null;
  isLoading: boolean;
  isError: boolean;
}

type RivalryCategory = "mostPlayed" | "closest" | "highestScoring" | "division";

const CATEGORIES: Array<{ key: RivalryCategory; label: string }> = [
  { key: "mostPlayed", label: "Most Played" },
  { key: "closest", label: "Closest Matchups" },
  { key: "highestScoring", label: "Highest Scoring" },
  { key: "division", label: "Division Rivals" },
];

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

function RivalryTable({ rivalries }: { rivalries: RivalryEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45]">
            <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Matchup
            </th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Games</th>
            <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Record</th>
            <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
              Avg Total
            </th>
            <th className="hidden py-2 text-right text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              Last Game
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {rivalries.map((r, idx) => (
            <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
              <td className="py-2.5">
                <span className="font-semibold text-[#d4af37]">{r.team1}</span>
                <span className="mx-1.5 text-[#5a6a7a]">vs</span>
                <span className="font-semibold text-[#d4af37]">{r.team2}</span>
              </td>
              <td className="py-2.5 text-center text-[#e0e0e0]">{r.totalGames}</td>
              <td className="py-2.5 text-center">
                <span className={`font-medium ${r.team1Wins > r.team2Wins ? "text-[#22c55e]" : "text-[#8899aa]"}`}>
                  {r.team1Wins}
                </span>
                <span className="mx-1 text-[#5a6a7a]">-</span>
                <span className={`font-medium ${r.team2Wins > r.team1Wins ? "text-[#22c55e]" : "text-[#8899aa]"}`}>
                  {r.team2Wins}
                </span>
                {r.ties > 0 && (
                  <>
                    <span className="mx-1 text-[#5a6a7a]">-</span>
                    <span className="text-[#8899aa]">{r.ties}</span>
                  </>
                )}
              </td>
              <td className="hidden py-2.5 text-center text-[#e0e0e0] sm:table-cell">{r.avgTotal}</td>
              <td className="hidden py-2.5 text-right text-[#8899aa] md:table-cell">
                {new Date(r.lastGame.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RivalryDashboard({ data, isLoading, isError }: RivalryProps) {
  const [activeCategory, setActiveCategory] = useState<RivalryCategory>("mostPlayed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading rivalry data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load rivalry data.</p>
      </div>
    );
  }

  if (!data) return null;

  const getRivalries = (): RivalryEntry[] => {
    switch (activeCategory) {
      case "mostPlayed":
        return data.mostPlayedMatchups;
      case "closest":
        return data.closestRivalries;
      case "highestScoring":
        return data.highestScoringRivalries;
      case "division":
        return data.divisionRivalries;
    }
  };

  const rivalries = getRivalries();
  const activeCat = CATEGORIES.find((c) => c.key === activeCategory)!;

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

      {/* Rivalries table */}
      <InfoPanel title={activeCat.label}>
        {rivalries.length > 0 ? (
          <RivalryTable rivalries={rivalries} />
        ) : (
          <p className="py-8 text-center text-sm text-[#5a6a7a]">No rivalries found in this category</p>
        )}
      </InfoPanel>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Total Rivalries</span>
          <span className="mt-1 text-xl font-bold text-[#f0f0f0]">{rivalries.length}</span>
        </div>
        {rivalries.length > 0 && (
          <>
            <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Games/Rivalry</span>
              <span className="mt-1 text-xl font-bold text-[#f0f0f0]">
                {(rivalries.reduce((sum, r) => sum + r.totalGames, 0) / rivalries.length).toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Avg Total Points</span>
              <span className="mt-1 text-xl font-bold text-[#f0f0f0]">
                {(rivalries.reduce((sum, r) => sum + parseFloat(r.avgTotal), 0) / rivalries.length).toFixed(1)}
              </span>
            </div>
            <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Total Games</span>
              <span className="mt-1 text-xl font-bold text-[#f0f0f0]">
                {rivalries.reduce((sum, r) => sum + r.totalGames, 0)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
