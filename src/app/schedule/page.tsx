"use client";

import { useState } from "react";
import { useSchedule } from "@/hooks/use-games";
import ScheduleDashboard from "@/components/schedule-dashboard";

export default function SchedulePage() {
  const [season, setSeason] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const { data, isLoading, isError } = useSchedule(season, week);

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">
            Schedule
          </h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Weekly scoreboard with scores, spreads, and team records.
          </p>
        </div>
        <ScheduleDashboard
          schedule={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
          season={season}
          week={week}
          onSeasonChange={setSeason}
          onWeekChange={setWeek}
        />
      </div>
    </div>
  );
}
