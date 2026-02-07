"use client";

import { useStreaks } from "@/hooks/use-games";
import StreaksDashboard from "@/components/streaks-dashboard";

export default function StreaksPage() {
  const { data, isLoading, isError } = useStreaks();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Streak & Momentum Tracker</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Track current and all-time winning/losing streaks, home/away streaks, and ATS records. Monitor momentum shifts and historic
            winning/losing runs across NFL history.
          </p>
        </div>
        <StreaksDashboard data={data?.data ?? null} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
