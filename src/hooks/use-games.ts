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
