"use client";

import { useATSLeaderboard } from "@/hooks/use-games";
import ATSLeaderboardDashboard from "@/components/ats-leaderboard-dashboard";

export default function ATSLeaderboardPage() {
  const { data, isLoading, isError } = useATSLeaderboard();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">ATS Leaderboard</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            All-time Against The Spread (ATS) leaderboard. See which teams consistently beat the spread and which teams struggle to cover their lines.
          </p>
        </div>
        <ATSLeaderboardDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
