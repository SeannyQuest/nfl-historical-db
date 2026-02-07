"use client";

import { use } from "react";
import { useTeamStats } from "@/hooks/use-games";
import TeamProfile from "@/components/team-profile";

export default function TeamPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const teamName = decodeURIComponent(name);
  const { data, isLoading, isError } = useTeamStats(teamName);

  return (
    <TeamProfile
      team={data?.data?.team ?? null}
      stats={data?.data?.stats ?? null}
      recentGames={data?.data?.recentGames ?? []}
      totalGames={data?.data?.totalGames ?? 0}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
