"use client";

import { useRouter } from "next/navigation";

interface GameRow {
  id: string;
  date: string;
  week: string;
  dayOfWeek: string;
  homeScore: number;
  awayScore: number;
  scoreDiff: number;
  primetime: string | null;
  isPlayoff: boolean;
  homeTeam: { name: string; abbreviation: string };
  awayTeam: { name: string; abbreviation: string };
  winner: { name: string; abbreviation: string } | null;
  bettingLine: {
    spread: number | null;
    overUnder: number | null;
    spreadResult: string | null;
    ouResult: string | null;
  } | null;
}

interface GameTableProps {
  games: GameRow[];
  isLoading: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function SpreadBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-[#5a6a7a]">--</span>;
  const color =
    result === "COVERED"
      ? "text-[#22c55e]"
      : result === "LOST"
        ? "text-[#ef4444]"
        : "text-[#d4af37]";
  return <span className={`text-xs font-medium ${color}`}>{result}</span>;
}

function OUBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-[#5a6a7a]">--</span>;
  const color =
    result === "OVER"
      ? "text-[#3b82f6]"
      : result === "UNDER"
        ? "text-[#f97316]"
        : "text-[#d4af37]";
  return <span className={`text-xs font-medium ${color}`}>{result}</span>;
}

function ScoreCell({
  score,
  isWinner,
}: {
  score: number;
  isWinner: boolean;
}) {
  return (
    <span className={isWinner ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"}>
      {score}
    </span>
  );
}

export default function GameTable({ games, isLoading }: GameTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[#5a6a7a]">Loading games...</div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[#1e2a45] bg-[#141b2d] py-16">
        <p className="text-sm text-[#5a6a7a]">No games found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#1e2a45]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e2a45] bg-[#141b2d]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Matchup
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
              Score
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              Spread
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">
              O/U
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">
              ATS
            </th>
            <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] lg:table-cell">
              O/U Result
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2a45]/50">
          {games.map((game) => {
            const homeWon = game.homeScore > game.awayScore;
            const awayWon = game.awayScore > game.homeScore;
            const totalScore = game.homeScore + game.awayScore;

            return (
              <tr
                key={game.id}
                onClick={() => router.push(`/games/${game.id}`)}
                className="game-row cursor-pointer transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="text-[#e0e0e0]">{formatDate(game.date)}</div>
                  <div className="text-xs text-[#5a6a7a]">
                    {game.isPlayoff ? game.week : `Wk ${game.week}`}
                    {game.primetime && (
                      <span className="ml-1.5 text-[#d4af37]">{game.primetime}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={awayWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                      {game.awayTeam.abbreviation}
                    </span>
                    <span className="text-[#5a6a7a]">@</span>
                    <span className={homeWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                      {game.homeTeam.abbreviation}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#5a6a7a]">
                    {game.awayTeam.name} at {game.homeTeam.name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 font-mono">
                    <ScoreCell score={game.awayScore} isWinner={awayWon} />
                    <span className="text-[#5a6a7a]">-</span>
                    <ScoreCell score={game.homeScore} isWinner={homeWon} />
                  </div>
                  <div className="mt-0.5 text-xs text-[#5a6a7a]">
                    Total: {totalScore}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-center font-mono text-[#e0e0e0] md:table-cell">
                  {game.bettingLine?.spread != null
                    ? (game.bettingLine.spread > 0 ? "+" : "") + game.bettingLine.spread
                    : <span className="text-[#5a6a7a]">--</span>}
                </td>
                <td className="hidden px-4 py-3 text-center font-mono text-[#e0e0e0] md:table-cell">
                  {game.bettingLine?.overUnder != null
                    ? game.bettingLine.overUnder
                    : <span className="text-[#5a6a7a]">--</span>}
                </td>
                <td className="hidden px-4 py-3 text-center lg:table-cell">
                  <SpreadBadge result={game.bettingLine?.spreadResult ?? null} />
                </td>
                <td className="hidden px-4 py-3 text-center lg:table-cell">
                  <OUBadge result={game.bettingLine?.ouResult ?? null} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
