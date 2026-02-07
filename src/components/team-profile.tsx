"use client";

import { useRouter } from "next/navigation";
import type { TeamStatsResult } from "@/lib/team-stats";

interface TeamInfo {
  name: string;
  abbreviation: string;
  city: string;
  nickname: string;
  conference: string;
  division: string;
  isActive: boolean;
}

interface RecentGame {
  id: string;
  date: string;
  week: string;
  isPlayoff: boolean;
  homeTeam: { name: string; abbreviation: string };
  awayTeam: { name: string; abbreviation: string };
  homeScore: number;
  awayScore: number;
  winner: { name: string; abbreviation: string } | null;
  spreadResult: string | null;
  ouResult: string | null;
}

interface TeamProfileProps {
  team: TeamInfo | null;
  stats: TeamStatsResult | null;
  recentGames: RecentGame[];
  totalGames: number;
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

function StatBox({ label, primary, secondary }: { label: string; primary: string; secondary?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-[#1e2a45] bg-[#141b2d] px-4 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">{label}</span>
      <span className="mt-1 text-xl font-bold text-[#f0f0f0]">{primary}</span>
      {secondary && <span className="mt-0.5 text-xs text-[#8899aa]">{secondary}</span>}
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

export default function TeamProfile({
  team,
  stats,
  recentGames,
  totalGames,
  isLoading,
  isError,
}: TeamProfileProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-[#5a6a7a]">Loading team profile...</p>
      </div>
    );
  }

  if (isError || !team || !stats) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#ef4444]">Team not found.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded border border-[#2a3a55] px-4 py-2 text-sm text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1.5 text-sm text-[#8899aa] transition-colors hover:text-[#d4af37]"
        >
          <span>&larr;</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Team header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-bold text-[#f0f0f0] sm:text-4xl">
              {team.abbreviation}
            </h1>
            <span className="text-lg text-[#8899aa]">{team.city} {team.nickname}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5a6a7a]">
            <span>{team.conference} {team.division}</span>
            <span>&middot;</span>
            <span>{totalGames} games</span>
            {!team.isActive && (
              <span className="rounded bg-[#ef4444]/15 px-2 py-0.5 text-[#ef4444]">Historical</span>
            )}
          </div>
        </div>

        {/* Record overview boxes */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox
            label="All-Time"
            primary={formatRecord(stats.allTime)}
            secondary={`${stats.allTime.pct} WIN%`}
          />
          <StatBox
            label="Home"
            primary={formatRecord(stats.homeRecord)}
            secondary={`${stats.homeRecord.pct} WIN%`}
          />
          <StatBox
            label="Away"
            primary={formatRecord(stats.awayRecord)}
            secondary={`${stats.awayRecord.pct} WIN%`}
          />
          <StatBox
            label="Playoffs"
            primary={formatRecord(stats.playoffRecord)}
            secondary={`${stats.playoffRecord.pct} WIN%`}
          />
        </div>

        {/* Stats panels */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Betting trends */}
          <InfoPanel title="Betting Trends">
            <div className="divide-y divide-[#1e2a45]/50">
              <DataRow
                label="ATS Record"
                value={`${stats.ats.covered}-${stats.ats.lost}-${stats.ats.push}`}
              />
              <DataRow
                label="Cover Rate"
                value={`${stats.ats.coverPct}`}
                color={
                  parseFloat(stats.ats.coverPct) >= 0.5
                    ? "text-[#22c55e]"
                    : "text-[#ef4444]"
                }
              />
              <DataRow label="ATS Games" value={stats.ats.total} />
              <DataRow
                label="Over/Under"
                value={`${stats.ou.over}-${stats.ou.under}-${stats.ou.push}`}
              />
              <DataRow label="O/U Games" value={stats.ou.total} />
            </div>
          </InfoPanel>

          {/* Scoring */}
          <InfoPanel title="Scoring">
            <div className="divide-y divide-[#1e2a45]/50">
              <DataRow label="Avg Points For" value={stats.avgPointsFor} />
              <DataRow label="Avg Points Against" value={stats.avgPointsAgainst} />
              <DataRow
                label="Avg Margin"
                value={
                  (parseFloat(stats.avgPointsFor) - parseFloat(stats.avgPointsAgainst)).toFixed(1)
                }
                color={
                  parseFloat(stats.avgPointsFor) > parseFloat(stats.avgPointsAgainst)
                    ? "text-[#22c55e]"
                    : parseFloat(stats.avgPointsFor) < parseFloat(stats.avgPointsAgainst)
                      ? "text-[#ef4444]"
                      : "text-[#e0e0e0]"
                }
              />
            </div>
          </InfoPanel>
        </div>

        {/* Recent games */}
        <div className="mb-6">
          <InfoPanel title="Recent Games">
            {recentGames.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#5a6a7a]">No games found</p>
            ) : (
              <div className="divide-y divide-[#1e2a45]/50">
                {recentGames.map((game) => {
                  const isHome = game.homeTeam.name === team.name;
                  const won = game.winner?.name === team.name;
                  const tied = game.winner === null;
                  const opp = isHome ? game.awayTeam : game.homeTeam;
                  const teamScore = isHome ? game.homeScore : game.awayScore;
                  const oppScore = isHome ? game.awayScore : game.homeScore;

                  return (
                    <div
                      key={game.id}
                      onClick={() => router.push(`/games/${game.id}`)}
                      className="flex cursor-pointer items-center justify-between py-2.5 transition-colors hover:bg-[#1e2a45]/30"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-5 text-center text-xs font-bold ${
                            won ? "text-[#22c55e]" : tied ? "text-[#d4af37]" : "text-[#ef4444]"
                          }`}
                        >
                          {won ? "W" : tied ? "T" : "L"}
                        </span>
                        <div>
                          <span className="text-sm text-[#e0e0e0]">
                            {isHome ? "vs" : "@"} {opp.abbreviation}
                          </span>
                          <span className="ml-2 font-mono text-sm text-[#8899aa]">
                            {teamScore}-{oppScore}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {game.spreadResult && (
                          <span className={`text-xs font-medium ${spreadColor(game.spreadResult)}`}>
                            {game.spreadResult}
                          </span>
                        )}
                        {game.ouResult && (
                          <span className={`text-xs font-medium ${ouColor(game.ouResult)}`}>
                            {game.ouResult}
                          </span>
                        )}
                        <span className="text-xs text-[#5a6a7a]">{formatDate(game.date)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </InfoPanel>
        </div>

        {/* Season-by-season breakdown */}
        {stats.seasons.length > 0 && (
          <InfoPanel title="Season-by-Season">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e2a45]">
                    <th className="py-2 text-left text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Year</th>
                    <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Record</th>
                    <th className="py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">Win%</th>
                    <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">ATS</th>
                    <th className="hidden py-2 text-center text-xs font-medium uppercase tracking-wider text-[#5a6a7a] sm:table-cell">Cover%</th>
                    <th className="hidden py-2 text-right text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">PF</th>
                    <th className="hidden py-2 text-right text-xs font-medium uppercase tracking-wider text-[#5a6a7a] md:table-cell">PA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2a45]/50">
                  {stats.seasons.map((s) => (
                    <tr key={s.season} className="transition-colors hover:bg-[#1e2a45]/30">
                      <td className="py-2 text-[#e0e0e0]">{s.season}</td>
                      <td className="py-2 text-center text-[#e0e0e0]">{formatRecord(s.record)}</td>
                      <td className="py-2 text-center text-[#8899aa]">{s.record.pct}</td>
                      <td className="hidden py-2 text-center text-[#e0e0e0] sm:table-cell">
                        {s.ats.total > 0
                          ? `${s.ats.covered}-${s.ats.lost}-${s.ats.push}`
                          : "--"}
                      </td>
                      <td
                        className={`hidden py-2 text-center sm:table-cell ${
                          parseFloat(s.ats.coverPct) >= 0.5 ? "text-[#22c55e]" : "text-[#ef4444]"
                        }`}
                      >
                        {s.ats.total > 0 ? s.ats.coverPct : "--"}
                      </td>
                      <td className="hidden py-2 text-right text-[#8899aa] md:table-cell">{s.pointsFor}</td>
                      <td className="hidden py-2 text-right text-[#8899aa] md:table-cell">{s.pointsAgainst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InfoPanel>
        )}
      </div>
    </div>
  );
}
