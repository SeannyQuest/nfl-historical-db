"use client";

import { useRouter } from "next/navigation";

interface GameData {
  id: string;
  date: string;
  week: string;
  time: string | null;
  dayOfWeek: string;
  homeScore: number;
  awayScore: number;
  scoreDiff: number;
  primetime: string | null;
  isPlayoff: boolean;
  homeTeam: { name: string; abbreviation: string; city: string; nickname: string };
  awayTeam: { name: string; abbreviation: string; city: string; nickname: string };
  winner: { name: string; abbreviation: string } | null;
  season: { year: number };
  bettingLine: {
    spread: number | null;
    overUnder: number | null;
    spreadResult: string | null;
    ouResult: string | null;
  } | null;
  weather: {
    temperature: number | null;
    wind: string | null;
    conditions: string | null;
  } | null;
}

interface GameDetailProps {
  game: GameData | null;
  isLoading: boolean;
  isError: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function resultColor(result: string | null, type: "spread" | "ou"): string {
  if (!result) return "text-[#5a6a7a]";
  if (type === "spread") {
    if (result === "COVERED") return "text-[#22c55e]";
    if (result === "LOST") return "text-[#ef4444]";
    return "text-[#d4af37]";
  }
  if (result === "OVER") return "text-[#3b82f6]";
  if (result === "UNDER") return "text-[#f97316]";
  return "text-[#d4af37]";
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
      <div className="border-b border-[#1e2a45] px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function DataRow({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#8899aa]">{label}</span>
      <span className={`text-sm font-medium ${color ?? "text-[#e0e0e0]"}`}>{value}</span>
    </div>
  );
}

export default function GameDetail({ game, isLoading, isError }: GameDetailProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#5a6a7a]">Loading game details...</p>
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#ef4444]">Game not found.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded border border-[#2a3a55] px-4 py-2 text-sm text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const homeWon = game.homeScore > game.awayScore;
  const awayWon = game.awayScore > game.homeScore;
  const isTie = game.homeScore === game.awayScore;
  const totalScore = game.homeScore + game.awayScore;

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1.5 text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
        >
          <span>&larr;</span>
          <span>Back to Games</span>
        </button>

        {/* Game context */}
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#5a6a7a]">
          <span>{game.season.year} Season</span>
          <span>&middot;</span>
          <span>{game.isPlayoff ? game.week : `Week ${game.week}`}</span>
          <span>&middot;</span>
          <span>{formatDate(game.date)}</span>
          {game.time && (
            <>
              <span>&middot;</span>
              <span>{game.time} ET</span>
            </>
          )}
          {game.primetime && (
            <span className="rounded bg-[#d4af37]/15 px-2 py-0.5 text-[#d4af37]">{game.primetime}</span>
          )}
          {game.isPlayoff && (
            <span className="rounded bg-[#3b82f6]/15 px-2 py-0.5 text-[#3b82f6]">Playoff</span>
          )}
        </div>

        {/* Scoreboard */}
        <div className="mb-8 overflow-hidden rounded-xl border border-[#1e2a45] bg-[#141b2d]">
          <div className="grid grid-cols-3">
            {/* Away team */}
            <div className={`flex flex-col items-center justify-center px-4 py-8 ${awayWon ? "bg-[#d4af37]/5" : ""}`}>
              <span
                onClick={() => router.push(`/teams/${encodeURIComponent(game.awayTeam.name)}`)}
                className="cursor-pointer text-3xl font-bold tracking-tight text-[#e0e0e0] transition-colors hover:text-[#d4af37] sm:text-4xl"
              >
                {game.awayTeam.abbreviation}
              </span>
              <span className="mt-1 text-xs text-[#8899aa] sm:text-sm">{game.awayTeam.city}</span>
              <span className="text-xs text-[#5a6a7a] sm:text-sm">{game.awayTeam.nickname}</span>
              {awayWon && <span className="mt-2 text-xs font-semibold text-[#d4af37]">WINNER</span>}
            </div>

            {/* Score */}
            <div className="flex flex-col items-center justify-center border-x border-[#1e2a45] py-8">
              <div className="flex items-baseline gap-3 font-mono">
                <span className={`text-4xl font-bold sm:text-5xl ${awayWon ? "text-[#f0f0f0]" : "text-[#8899aa]"}`}>
                  {game.awayScore}
                </span>
                <span className="text-lg text-[#5a6a7a]">-</span>
                <span className={`text-4xl font-bold sm:text-5xl ${homeWon ? "text-[#f0f0f0]" : "text-[#8899aa]"}`}>
                  {game.homeScore}
                </span>
              </div>
              {isTie && <span className="mt-2 text-xs font-semibold text-[#d4af37]">TIE</span>}
              {!isTie && (
                <span className="mt-2 text-xs text-[#5a6a7a]">
                  {Math.abs(game.scoreDiff)} point margin
                </span>
              )}
              <span className="mt-1 text-xs text-[#5a6a7a]">Total: {totalScore}</span>
            </div>

            {/* Home team */}
            <div className={`flex flex-col items-center justify-center px-4 py-8 ${homeWon ? "bg-[#d4af37]/5" : ""}`}>
              <span
                onClick={() => router.push(`/teams/${encodeURIComponent(game.homeTeam.name)}`)}
                className="cursor-pointer text-3xl font-bold tracking-tight text-[#e0e0e0] transition-colors hover:text-[#d4af37] sm:text-4xl"
              >
                {game.homeTeam.abbreviation}
              </span>
              <span className="mt-1 text-xs text-[#8899aa] sm:text-sm">{game.homeTeam.city}</span>
              <span className="text-xs text-[#5a6a7a] sm:text-sm">{game.homeTeam.nickname}</span>
              {homeWon && <span className="mt-2 text-xs font-semibold text-[#d4af37]">WINNER</span>}
            </div>
          </div>
        </div>

        {/* Info panels */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Betting panel */}
          <InfoPanel title="Betting Line">
            {game.bettingLine ? (
              <div className="divide-y divide-[#1e2a45]/50">
                <DataRow
                  label="Spread"
                  value={
                    game.bettingLine.spread != null
                      ? `${game.homeTeam.abbreviation} ${game.bettingLine.spread > 0 ? "+" : ""}${game.bettingLine.spread}`
                      : "--"
                  }
                />
                <DataRow
                  label="Over/Under"
                  value={game.bettingLine.overUnder ?? "--"}
                />
                <DataRow
                  label="ATS Result"
                  value={game.bettingLine.spreadResult ?? "--"}
                  color={resultColor(game.bettingLine.spreadResult, "spread")}
                />
                <DataRow
                  label="O/U Result"
                  value={game.bettingLine.ouResult ?? "--"}
                  color={resultColor(game.bettingLine.ouResult, "ou")}
                />
                <DataRow
                  label="Total Points"
                  value={totalScore}
                />
                {game.bettingLine.overUnder != null && (
                  <DataRow
                    label="O/U Margin"
                    value={`${totalScore > game.bettingLine.overUnder ? "+" : ""}${(totalScore - game.bettingLine.overUnder).toFixed(1)}`}
                    color={
                      totalScore > game.bettingLine.overUnder
                        ? "text-[#3b82f6]"
                        : totalScore < game.bettingLine.overUnder
                          ? "text-[#f97316]"
                          : "text-[#d4af37]"
                    }
                  />
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-[#5a6a7a]">No betting data available</p>
            )}
          </InfoPanel>

          {/* Weather panel */}
          <InfoPanel title="Game Conditions">
            {game.weather ? (
              <div className="divide-y divide-[#1e2a45]/50">
                {game.weather.temperature != null && (
                  <DataRow label="Temperature" value={`${game.weather.temperature}&deg;F`} />
                )}
                {game.weather.wind && (
                  <DataRow label="Wind" value={game.weather.wind} />
                )}
                {game.weather.conditions && (
                  <DataRow label="Conditions" value={game.weather.conditions} />
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-[#5a6a7a]">No weather data available</p>
            )}

            {/* Game info section */}
            <div className="mt-4 border-t border-[#1e2a45] pt-4">
              <div className="divide-y divide-[#1e2a45]/50">
                <DataRow label="Day" value={game.dayOfWeek} />
                {game.time && <DataRow label="Kickoff" value={`${game.time} ET`} />}
                <DataRow label="Season" value={game.season.year} />
                <DataRow
                  label="Week"
                  value={game.isPlayoff ? game.week : `Week ${game.week}`}
                />
              </div>
            </div>
          </InfoPanel>
        </div>
      </div>
    </div>
  );
}
