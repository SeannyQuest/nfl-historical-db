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
