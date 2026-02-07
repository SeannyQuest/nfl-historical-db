"use client";

import { useWeatherImpact } from "@/hooks/use-games";
import WeatherImpactDashboard from "@/components/weather-impact-dashboard";

export default function WeatherPage() {
  const { data, isLoading, isError } = useWeatherImpact();

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Weather Impact Analysis</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Comprehensive analysis of how weather conditions affect NFL game outcomes, scoring, and betting results.
          </p>
        </div>
        <WeatherImpactDashboard
          data={data?.data ?? null}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
