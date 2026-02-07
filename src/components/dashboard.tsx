"use client";

import { useState } from "react";
import { useGames, useTeams, useSeasons } from "@/hooks/use-games";
import GameTable from "@/components/game-table";
import FilterBar from "@/components/filter-bar";
import StatCard from "@/components/stat-card";
import Pagination from "@/components/pagination";

const REGULAR_WEEKS = Array.from({ length: 18 }, (_, i) => String(i + 1));
const PLAYOFF_WEEKS = ["WildCard", "Division", "ConfChamp", "SuperBowl"];
const ALL_WEEKS = [...REGULAR_WEEKS, ...PLAYOFF_WEEKS];

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [season, setSeason] = useState("");
  const [week, setWeek] = useState("");
  const [team, setTeam] = useState("");

  const { data: gamesData, isLoading: gamesLoading } = useGames({
    page,
    limit: 25,
    season: season || undefined,
    week: week || undefined,
    team: team || undefined,
    sort: "date",
    order: "desc",
  });

  const { data: teamsData } = useTeams();
  const { data: seasonsData } = useSeasons();

  const games = gamesData?.data ?? [];
  const pagination = gamesData?.pagination;
  const teamNames = (teamsData?.data ?? [])
    .map((t: { name: string }) => t.name)
    .sort();
  const seasonYears = (seasonsData?.data ?? [])
    .map((s: { year: number }) => s.year)
    .sort((a: number, b: number) => b - a);

  function handleSeasonChange(v: string) {
    setSeason(v);
    setPage(1);
  }

  function handleWeekChange(v: string) {
    setWeek(v);
    setPage(1);
  }

  function handleTeamChange(v: string) {
    setTeam(v);
    setPage(1);
  }

  function handleReset() {
    setSeason("");
    setWeek("");
    setTeam("");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Total Games"
            value={pagination?.total?.toLocaleString() ?? "--"}
            detail={season ? `${season} season` : "All time"}
          />
          <StatCard
            label="Page"
            value={pagination ? `${pagination.page} / ${pagination.totalPages}` : "--"}
            detail={`${pagination?.limit ?? 25} per page`}
          />
          <StatCard
            label="Seasons"
            value={seasonYears.length || "--"}
            detail={seasonYears.length >= 2 ? `${seasonYears[seasonYears.length - 1]}–${seasonYears[0]}` : ""}
          />
          <StatCard
            label="Teams"
            value={teamNames.length || "--"}
            detail="Active franchises"
          />
        </div>

        {/* Filter bar */}
        <div className="mb-4 rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-3">
          <FilterBar
            season={season}
            week={week}
            team={team}
            onSeasonChange={handleSeasonChange}
            onWeekChange={handleWeekChange}
            onTeamChange={handleTeamChange}
            onReset={handleReset}
            seasons={seasonYears}
            weeks={ALL_WEEKS}
            teams={teamNames}
          />
        </div>

        {/* Game table */}
        <GameTable games={games} isLoading={gamesLoading} />

        {/* Pagination */}
        {pagination && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
