"use client";

import { useQuery } from "@tanstack/react-query";

interface UseGamesParams {
  page?: number;
  limit?: number;
  season?: string;
  week?: string;
  team?: string;
  sort?: string;
  order?: string;
}

export function useGames(params: UseGamesParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.season) searchParams.set("season", params.season);
  if (params.week) searchParams.set("week", params.week);
  if (params.team) searchParams.set("team", params.team);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.order) searchParams.set("order", params.order);

  const qs = searchParams.toString();
  const url = `/api/games${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: ["games", params],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
  });
}

export function useGame(id: string) {
  return useQuery({
    queryKey: ["game", id],
    queryFn: async () => {
      const res = await fetch(`/api/games/${id}`);
      if (!res.ok) throw new Error("Failed to fetch game");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const res = await fetch("/api/teams?isActive=true");
      if (!res.ok) throw new Error("Failed to fetch teams");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const res = await fetch("/api/seasons");
      if (!res.ok) throw new Error("Failed to fetch seasons");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeamStats(teamName: string) {
  return useQuery({
    queryKey: ["teamStats", teamName],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${encodeURIComponent(teamName)}/stats`);
      if (!res.ok) throw new Error("Failed to fetch team stats");
      return res.json();
    },
    enabled: !!teamName,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrends() {
  return useQuery({
    queryKey: ["trends"],
    queryFn: async () => {
      const res = await fetch("/api/trends");
      if (!res.ok) throw new Error("Failed to fetch trends");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStandings(season: string | null) {
  return useQuery({
    queryKey: ["standings", season],
    queryFn: async () => {
      const url = season ? `/api/standings?season=${season}` : "/api/standings";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch standings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecords() {
  return useQuery({
    queryKey: ["records"],
    queryFn: async () => {
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchedule(season: string | null, week: string | null) {
  return useQuery({
    queryKey: ["schedule", season, week],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (season) params.set("season", season);
      if (week) params.set("week", week);
      const qs = params.toString();
      const url = `/api/schedule${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch schedule");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlayoffStats() {
  return useQuery({
    queryKey: ["playoffStats"],
    queryFn: async () => {
      const res = await fetch("/api/playoff-stats");
      if (!res.ok) throw new Error("Failed to fetch playoff stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useApiUsage() {
  return useQuery({
    queryKey: ["apiUsage"],
    queryFn: async () => {
      const res = await fetch("/api/api-usage");
      if (!res.ok) throw new Error("Failed to fetch API usage");
      return res.json();
    },
    staleTime: 30 * 1000, // refresh more often for admin
  });
}

export function useMatchup(team1: string, team2: string) {
  return useQuery({
    queryKey: ["matchup", team1, team2],
    queryFn: async () => {
      const params = new URLSearchParams({ team1, team2 });
      const res = await fetch(`/api/matchups?${params}`);
      if (!res.ok) throw new Error("Failed to fetch matchup");
      return res.json();
    },
    enabled: !!team1 && !!team2 && team1 !== team2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch search results");
      return res.json();
    },
    enabled: !!query && query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useScoringAnalysis() {
  return useQuery({
    queryKey: ["scoringAnalysis"],
    queryFn: async () => {
      const res = await fetch("/api/scoring-analysis");
      if (!res.ok) throw new Error("Failed to fetch scoring analysis");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeAdvantage() {
  return useQuery({
    queryKey: ["homeAdvantage"],
    queryFn: async () => {
      const res = await fetch("/api/home-advantage");
      if (!res.ok) throw new Error("Failed to fetch home advantage data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsets() {
  return useQuery({
    queryKey: ["upsets"],
    queryFn: async () => {
      const res = await fetch("/api/upsets");
      if (!res.ok) throw new Error("Failed to fetch upsets data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRivalries() {
  return useQuery({
    queryKey: ["rivalries"],
    queryFn: async () => {
      const res = await fetch("/api/rivalries");
      if (!res.ok) throw new Error("Failed to fetch rivalries data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeatherImpact() {
  return useQuery({
    queryKey: ["weatherImpact"],
    queryFn: async () => {
      const res = await fetch("/api/weather-impact");
      if (!res.ok) throw new Error("Failed to fetch weather impact data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFranchiseHistory() {
  return useQuery({
    queryKey: ["franchiseHistory"],
    queryFn: async () => {
      const res = await fetch("/api/franchise-history");
      if (!res.ok) throw new Error("Failed to fetch franchise history data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useByeWeekImpact() {
  return useQuery({
    queryKey: ["byeWeekImpact"],
    queryFn: async () => {
      const res = await fetch("/api/bye-week");
      if (!res.ok) throw new Error("Failed to fetch bye week impact data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConferenceComparison() {
  return useQuery({
    queryKey: ["conferenceComparison"],
    queryFn: async () => {
      const res = await fetch("/api/conference-comparison");
      if (!res.ok) throw new Error("Failed to fetch conference comparison data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useEraComparison() {
  return useQuery({
    queryKey: ["eraComparison"],
    queryFn: async () => {
      const res = await fetch("/api/era-comparison");
      if (!res.ok) throw new Error("Failed to fetch era comparison");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrimetimeStats() {
  return useQuery({
    queryKey: ["primetimeStats"],
    queryFn: async () => {
      const res = await fetch("/api/primetime");
      if (!res.ok) throw new Error("Failed to fetch primetime stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStreaks() {
  return useQuery({
    queryKey: ["streaks"],
    queryFn: async () => {
      const res = await fetch("/api/streaks");
      if (!res.ok) throw new Error("Failed to fetch streaks data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDivisionHistory() {
  return useQuery({
    queryKey: ["divisionHistory"],
    queryFn: async () => {
      const res = await fetch("/api/division-history");
      if (!res.ok) throw new Error("Failed to fetch division history");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface UseGameFinderParams {
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

export function useGameFinder(params: UseGameFinderParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.minScore) searchParams.set("minScore", String(params.minScore));
  if (params.maxScore) searchParams.set("maxScore", String(params.maxScore));
  if (params.minTotal) searchParams.set("minTotal", String(params.minTotal));
  if (params.maxTotal) searchParams.set("maxTotal", String(params.maxTotal));
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.team) searchParams.set("team", params.team);
  if (params.season) searchParams.set("season", params.season);
  if (params.overtime) searchParams.set("overtime", String(params.overtime));
  if (params.coverPerspective) searchParams.set("coverPerspective", params.coverPerspective);

  const qs = searchParams.toString();
  const url = `/api/games${qs ? `?${qs}` : ""}`;

  return useQuery({
    queryKey: ["gameFinder", params],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json();
    },
  });
}

export function useSuperBowlStats() {
  return useQuery({
    queryKey: ["superBowlStats"],
    queryFn: async () => {
      const res = await fetch("/api/super-bowl");
      if (!res.ok) throw new Error("Failed to fetch Super Bowl stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCloseGames() {
  return useQuery({
    queryKey: ["closeGames"],
    queryFn: async () => {
      const res = await fetch("/api/close-games");
      if (!res.ok) throw new Error("Failed to fetch close games");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeasonSimulator(season: string | null) {
  return useQuery({
    queryKey: ["seasonSimulator", season],
    queryFn: async () => {
      const url = season ? `/api/season-simulator?season=${season}` : "/api/season-simulator";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch season simulator");
      return res.json();
    },
    enabled: !!season,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePowerRankings() {
  return useQuery({
    queryKey: ["powerRankings"],
    queryFn: async () => {
      const res = await fetch("/api/power-rankings");
      if (!res.ok) throw new Error("Failed to fetch power rankings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameGrades() {
  return useQuery({
    queryKey: ["gameGrades"],
    queryFn: async () => {
      const res = await fetch("/api/game-grades");
      if (!res.ok) throw new Error("Failed to fetch game grades");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBettingValue() {
  return useQuery({
    queryKey: ["bettingValue"],
    queryFn: async () => {
      const res = await fetch("/api/betting-value");
      if (!res.ok) throw new Error("Failed to fetch betting value");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useATSLeaderboard() {
  return useQuery({
    queryKey: ["atsLeaderboard"],
    queryFn: async () => {
      const res = await fetch("/api/ats-leaderboard");
      if (!res.ok) throw new Error("Failed to fetch ATS leaderboard");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSituationalStats() {
  return useQuery({
    queryKey: ["situationalStats"],
    queryFn: async () => {
      const res = await fetch("/api/situational");
      if (!res.ok) throw new Error("Failed to fetch situational stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useScheduleStrength(season: string | null) {
  return useQuery({
    queryKey: ["scheduleStrength", season],
    queryFn: async () => {
      const url = season ? `/api/schedule-strength?season=${season}` : "/api/schedule-strength";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch schedule strength");
      return res.json();
    },
    enabled: !!season,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoachingStats() {
  return useQuery({
    queryKey: ["coachingStats"],
    queryFn: async () => {
      const res = await fetch("/api/coaching");
      if (!res.ok) throw new Error("Failed to fetch coaching stats");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
