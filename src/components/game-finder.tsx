"use client";

import { useState } from "react";
import { useGameFinder, useTeams, useSeasons } from "@/hooks/use-games";

interface FilterState {
  minScore?: number;
  maxScore?: number;
  minTotal?: number;
  maxTotal?: number;
  startDate?: string;
  endDate?: string;
  team?: string;
  season?: string;
  overtime?: boolean;
  coverPerspective?: "home" | "away" | "all";
}

export default function GameFinder() {
  const [filters, setFilters] = useState<FilterState>({});
  const { data: gamesData, isLoading: gamesLoading } = useGameFinder(filters);
  const { data: teamsData } = useTeams();
  const { data: seasonsData } = useSeasons();

  const teams = teamsData?.data ?? [];
  const seasons = seasonsData?.data ?? [];
  const games = gamesData?.data ?? [];

  const handleFilterChange = (key: keyof FilterState, value: string | number | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(games, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `games-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Form */}
      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-6">
        <h2 className="mb-6 text-lg font-bold text-[#f0f0f0]">Filter Games</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Score Range */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Min Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.minScore ?? ""}
              onChange={(e) => handleFilterChange("minScore", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] placeholder-[#5a6a7a] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Max Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={filters.maxScore ?? ""}
              onChange={(e) => handleFilterChange("maxScore", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="100"
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] placeholder-[#5a6a7a] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Total Points Range */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Min Total Points
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={filters.minTotal ?? ""}
              onChange={(e) => handleFilterChange("minTotal", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="0"
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] placeholder-[#5a6a7a] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Max Total Points
            </label>
            <input
              type="number"
              min="0"
              max="200"
              value={filters.maxTotal ?? ""}
              onChange={(e) => handleFilterChange("maxTotal", e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="200"
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] placeholder-[#5a6a7a] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate ?? ""}
              onChange={(e) => handleFilterChange("startDate", e.target.value || undefined)}
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate ?? ""}
              onChange={(e) => handleFilterChange("endDate", e.target.value || undefined)}
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          {/* Team Select */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Team
            </label>
            <select
              value={filters.team ?? ""}
              onChange={(e) => handleFilterChange("team", e.target.value || undefined)}
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="">All Teams</option>
              {teams.map((t: { id: string; name: string }) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Season Select */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Season
            </label>
            <select
              value={filters.season ?? ""}
              onChange={(e) => handleFilterChange("season", e.target.value || undefined)}
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="">All Seasons</option>
              {seasons.map((s: { id: string; year: number }) => (
                <option key={s.id} value={s.year}>
                  {s.year}
                </option>
              ))}
            </select>
          </div>

          {/* Cover Perspective */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Betting Perspective
            </label>
            <select
              value={filters.coverPerspective ?? "all"}
              onChange={(e) => handleFilterChange("coverPerspective", (e.target.value as "home" | "away" | "all") || undefined)}
              className="mt-2 w-full rounded border border-[#1e2a45] bg-[#0a0f1a] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
            >
              <option value="all">All Results</option>
              <option value="home">Home Covers</option>
              <option value="away">Away Covers</option>
            </select>
          </div>

          {/* Overtime Checkbox */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-[#8899aa]">
              <input
                type="checkbox"
                checked={filters.overtime ?? false}
                onChange={(e) => handleFilterChange("overtime", e.target.checked || undefined)}
                className="rounded border border-[#1e2a45] bg-[#0a0f1a]"
              />
              Overtime Games Only
            </label>
          </div>
        </div>
      </div>

      {/* Results Info & Export */}
      <div className="flex items-center justify-between rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
        <div>
          <p className="text-sm text-[#8899aa]">Games Found</p>
          <p className="text-2xl font-bold text-[#d4af37]">
            {gamesLoading ? "..." : games.length}
          </p>
        </div>
        <button
          onClick={handleExportJSON}
          disabled={games.length === 0 || gamesLoading}
          className="rounded border border-[#d4af37] bg-[#0a0f1a] px-4 py-2 text-sm font-medium text-[#d4af37] transition-colors hover:bg-[#d4af37] hover:text-[#0a0f1a] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#d4af37]"
        >
          Export as JSON
        </button>
      </div>

      {/* Results Table */}
      {games.length > 0 && (
        <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a45]">
                  <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                    Home Team
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                    Score
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
                    Away Team
                  </th>
                  <th className="hidden py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">
                    Total
                  </th>
                  <th className="hidden py-3 px-4 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
                    Season
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a45]/50">
                {games.slice(0, 20).map((game: { date: string; homeTeam?: { name: string }; homeScore: number; awayScore: number; awayTeam?: { name: string }; season?: { year: number } }, idx: number) => (
                  <tr key={idx} className="transition-colors hover:bg-[#1e2a45]/30">
                    <td className="py-3 px-4 text-sm text-[#8899aa]">
                      {new Date(game.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#d4af37]">
                      {game.homeTeam?.name ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-center text-sm font-bold text-[#e0e0e0]">
                      {game.homeScore}-{game.awayScore}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-[#d4af37]">
                      {game.awayTeam?.name ?? "—"}
                    </td>
                    <td className="hidden py-3 px-4 text-center text-sm text-[#8899aa] sm:table-cell">
                      {game.homeScore + game.awayScore}
                    </td>
                    <td className="hidden py-3 px-4 text-center text-sm text-[#8899aa] md:table-cell">
                      {game.season?.year ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {games.length > 20 && (
            <div className="border-t border-[#1e2a45] px-4 py-3 text-center text-sm text-[#8899aa]">
              Showing 20 of {games.length} games. Use export to see all results.
            </div>
          )}
        </div>
      )}

      {!gamesLoading && games.length === 0 && (
        <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-8 text-center">
          <p className="text-[#8899aa]">No games found matching your filters. Try adjusting your criteria.</p>
        </div>
      )}

      {gamesLoading && (
        <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-8 text-center">
          <p className="text-[#8899aa]">Loading games...</p>
        </div>
      )}
    </div>
  );
}
