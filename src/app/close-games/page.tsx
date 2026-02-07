"use client";

import { useCloseGames } from "@/hooks/use-games";
import CloseGamesDashboard from "@/components/close-games-dashboard";

export default function CloseGamesPage() {
  const { data, isLoading, isError } = useCloseGames();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Close Games Analysis</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Analyze games decided by 3, 7, and 10 points. Track clutch performance by team and identify teams that excel (or struggle) in close contests.
          </p>
        </div>
        <CloseGamesDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
