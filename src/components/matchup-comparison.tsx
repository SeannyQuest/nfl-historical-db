"use client";

import { useRouter } from "next/navigation";
import type { MatchupResult } from "@/lib/matchups";

interface TeamInfo {
  name: string;
  abbreviation: string;
  city: string;
  nickname: string;
}

interface MatchupComparisonProps {
  matchup: (MatchupResult & { team1Info: TeamInfo; team2Info: TeamInfo }) | null;
  isLoading: boolean;
  isError: boolean;
}

function formatRecord(r: { wins: number; losses: number; ties: number }) {
  return r.ties > 0 ? `${r.wins}-${r.losses}-${r.ties}` : `${r.wins}-${r.losses}`;
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

function spreadColor(result: string | null): string {
  if (result === "COVERED") return "text-[#22c55e]";
  if (result === "LOST") return "text-[#ef4444]";
  if (result === "PUSH") return "text-[#d4af37]";
  return "text-[#5a6a7a]";
}

function ouColor(result: string | null): string {
  if (result === "OVER") return "text-[#3b82f6]";
  if (result === "UNDER") return "text-[#f97316]";
  if (result === "PUSH") return "text-[#d4af37]";
  return "text-[#5a6a7a]";
}

export default function MatchupComparison({ matchup, isLoading, isError }: MatchupComparisonProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading matchup data...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load matchup data.</p>
      </div>
    );
  }

  if (!matchup) return null;

  const { team1Info, team2Info, team1Record, team2Record } = matchup;
  const t1WinPct = parseFloat(team1Record.pct);
  const t2WinPct = parseFloat(team2Record.pct);

  return (
    <div className="space-y-6">
      {/* Head-to-head scoreboard */}
      <div className="overflow-hidden rounded-xl border border-[#1e2a45] bg-[#141b2d]">
        <div className="grid grid-cols-3">
          {/* Team 1 */}
          <div className={`flex flex-col items-center justify-center px-4 py-8 ${t1WinPct > t2WinPct ? "bg-[#d4af37]/5" : ""}`}>
            <span
              onClick={() => router.push(`/teams/${encodeURIComponent(team1Info.name)}`)}
              className="cursor-pointer text-3xl font-bold tracking-tight text-[#e0e0e0] transition-colors hover:text-[#d4af37] sm:text-4xl"
            >
              {team1Info.abbreviation}
            </span>
            <span className="mt-1 text-xs text-[#8899aa] sm:text-sm">{team1Info.city}</span>
            <span className="text-xs text-[#5a6a7a] sm:text-sm">{team1Info.nickname}</span>
            <span className="mt-3 text-2xl font-bold text-[#f0f0f0]">
              {formatRecord(team1Record)}
            </span>
            <span className="text-xs text-[#8899aa]">{team1Record.pct} WIN%</span>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center border-x border-[#1e2a45] py-8">
            <span className="text-sm font-medium uppercase tracking-widest text-[#5a6a7a]">vs</span>
            <span className="mt-2 text-3xl font-bold text-[#d4af37]">{matchup.totalGames}</span>
            <span className="text-xs text-[#5a6a7a]">games</span>
            {matchup.streakTeam && (
              <div className="mt-3 text-center">
                <span className="text-xs text-[#5a6a7a]">Current streak</span>
                <div className="text-sm font-semibold text-[#d4af37]">
                  {matchup.streakTeam === team1Info.name ? team1Info.abbreviation : team2Info.abbreviation} {matchup.streakCount}W
                </div>
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex flex-col items-center justify-center px-4 py-8 ${t2WinPct > t1WinPct ? "bg-[#d4af37]/5" : ""}`}>
            <span
              onClick={() => router.push(`/teams/${encodeURIComponent(team2Info.name)}`)}
              className="cursor-pointer text-3xl font-bold tracking-tight text-[#e0e0e0] transition-colors hover:text-[#d4af37] sm:text-4xl"
            >
              {team2Info.abbreviation}
            </span>
            <span className="mt-1 text-xs text-[#8899aa] sm:text-sm">{team2Info.city}</span>
            <span className="text-xs text-[#5a6a7a] sm:text-sm">{team2Info.nickname}</span>
            <span className="mt-3 text-2xl font-bold text-[#f0f0f0]">
              {formatRecord(team2Record)}
            </span>
            <span className="text-xs text-[#8899aa]">{team2Record.pct} WIN%</span>
          </div>
        </div>
      </div>

      {/* Stats panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Scoring trends */}
        <InfoPanel title="Scoring Trends">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Avg Total Points" value={matchup.scoring.avgTotal} />
            <DataRow label="Avg Margin" value={matchup.scoring.avgMargin} />
            <DataRow label="Highest Total" value={matchup.scoring.highestTotal} />
            <DataRow label="Lowest Total" value={matchup.scoring.lowestTotal} />
          </div>
        </InfoPanel>

        {/* Betting trends */}
        <InfoPanel title="Betting Trends">
          <div className="divide-y divide-[#1e2a45]/50">
            <DataRow label="Favorite" value={matchup.betting.favoriteRecord} />
            <DataRow label="Avg Spread" value={matchup.betting.avgSpread} />
            <DataRow
              label="Over/Under"
              value={`${matchup.betting.overCount}-${matchup.betting.underCount}-${matchup.betting.pushCount}`}
            />
            <DataRow
              label="Over %"
              value={matchup.betting.overPct}
              color={
                parseFloat(matchup.betting.overPct) >= 0.5
                  ? "text-[#3b82f6]"
                  : "text-[#f97316]"
              }
            />
          </div>
        </InfoPanel>
      </div>

      {/* Recent matchups */}
      <InfoPanel title="Recent Matchups">
        {matchup.recentGames.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#5a6a7a]">No games found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2a45]">
                  <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Date</th>
                  <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Matchup</th>
                  <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Score</th>
                  <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">ATS</th>
                  <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">O/U</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2a45]/50">
                {matchup.recentGames.map((game, i) => {
                  const awayAbbr = game.awayTeamName === team1Info.name ? team1Info.abbreviation : team2Info.abbreviation;
                  const homeAbbr = game.homeTeamName === team1Info.name ? team1Info.abbreviation : team2Info.abbreviation;
                  const homeWon = game.homeScore > game.awayScore;
                  const awayWon = game.awayScore > game.homeScore;

                  return (
                    <tr key={i} className="transition-colors hover:bg-[#1e2a45]/30">
                      <td className="py-2 text-[#e0e0e0]">
                        <div>{formatDate(game.date)}</div>
                        <div className="text-xs text-[#5a6a7a]">
                          {game.isPlayoff ? game.week : `Wk ${game.week}`}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span className={awayWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                          {awayAbbr}
                        </span>
                        <span className="mx-2 text-[#5a6a7a]">@</span>
                        <span className={homeWon ? "font-semibold text-[#f0f0f0]" : "text-[#8899aa]"}>
                          {homeAbbr}
                        </span>
                      </td>
                      <td className="py-2 text-center font-mono">
                        <span className={awayWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"}>
                          {game.awayScore}
                        </span>
                        <span className="mx-1 text-[#5a6a7a]">-</span>
                        <span className={homeWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"}>
                          {game.homeScore}
                        </span>
                      </td>
                      <td className={`hidden py-2 text-center sm:table-cell ${spreadColor(game.spreadResult)}`}>
                        {game.spreadResult ?? "--"}
                      </td>
                      <td className={`hidden py-2 text-center sm:table-cell ${ouColor(game.ouResult)}`}>
                        {game.ouResult ?? "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </InfoPanel>
    </div>
  );
}
