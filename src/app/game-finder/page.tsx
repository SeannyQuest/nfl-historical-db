"use client";

import GameFinder from "@/components/game-finder";

export default function GameFinderPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">Game Finder</h1>
          <p className="mt-2 text-sm text-[#8899aa]">
            Search and filter NFL games by score, date, team, and season. Export results as JSON.
          </p>
        </div>
        <GameFinder />
      </div>
    </div>
  );
}
