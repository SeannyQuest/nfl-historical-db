"use client";

import { useState } from "react";
import { useTeams, useMatchup } from "@/hooks/use-games";
import MatchupComparison from "@/components/matchup-comparison";

export default function MatchupsPage() {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const { data: teamsData } = useTeams();
  const { data: matchupData, isLoading, isError } = useMatchup(team1, team2);

  const teams: { name: string; abbreviation: string }[] = (teamsData?.data ?? []).sort(
    (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
  );

  const hasSelection = team1 && team2 && team1 !== team2;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#f0f0f0] sm:text-3xl">Head-to-Head Matchups</h1>
          <p className="mt-1 text-sm text-[#5a6a7a]">
            Compare historical records, scoring trends, and betting data between two teams
          </p>
        </div>

        {/* Team selector */}
        <div className="mb-8 rounded-lg border border-[#1e2a45] bg-[#141b2d] px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="team1-select" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                Team 1
              </label>
              <select
                id="team1-select"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
                aria-label="Select team 1"
                className="input-glow w-full rounded border border-[#1e2a45] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] transition-colors focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">Select a team</option>
                {teams.map((t) => (
                  <option key={t.name} value={t.name} disabled={t.name === team2}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center sm:pb-1">
              <span className="text-sm font-medium text-[#5a6a7a]">VS</span>
            </div>

            <div className="flex-1">
              <label htmlFor="team2-select" className="mb-1 block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                Team 2
              </label>
              <select
                id="team2-select"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
                aria-label="Select team 2"
                className="input-glow w-full rounded border border-[#1e2a45] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] transition-colors focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">Select a team</option>
                {teams.map((t) => (
                  <option key={t.name} value={t.name} disabled={t.name === team1}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {(team1 || team2) && (
              <button
                onClick={() => {
                  setTeam1("");
                  setTeam2("");
                }}
                className="rounded border border-[#2a3a55] px-4 py-2 text-sm text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Clear
              </button>
            )}
          </div>

          {team1 && team2 && team1 === team2 && (
            <p className="mt-2 text-xs text-[#ef4444]">Please select two different teams</p>
          )}
        </div>

        {/* Prompt when no selection */}
        {!hasSelection && (
          <div className="flex items-center justify-center rounded-lg border border-[#1e2a45] bg-[#141b2d] py-20">
            <p className="text-sm text-[#5a6a7a]">Select two teams to compare their head-to-head history</p>
          </div>
        )}

        {/* Matchup results */}
        {hasSelection && (
          <MatchupComparison
            matchup={matchupData?.data ?? null}
            isLoading={isLoading}
            isError={isError}
          />
        )}
      </div>
    </div>
  );
}
