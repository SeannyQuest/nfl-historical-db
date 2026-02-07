"use client";

import { useRouter } from "next/navigation";
import type { ScheduleResult, ScorebugEntry, WeekGroup } from "@/lib/schedule";

interface ScheduleDashboardProps {
  schedule: ScheduleResult | null;
  isLoading: boolean;
  isError: boolean;
  season: string | null;
  week: string | null;
  onSeasonChange: (season: string | null) => void;
  onWeekChange: (week: string | null) => void;
}

// ─── Scorebug card ──────────────────────────────────────

function Scorebug({ entry }: { entry: ScorebugEntry }) {
  const router = useRouter();
  const { game, homeRecord, awayRecord, statusLabel } = entry;
  const homeWon = game.homeScore > game.awayScore;
  const awayWon = game.awayScore > game.homeScore;
  const isCompleted = statusLabel === "Final" || statusLabel === "TIE";

  return (
    <div
      onClick={() => router.push(`/games/${game.id}`)}
      className="cursor-pointer rounded-lg border border-[#1e2a45] bg-[#141b2d] transition-colors hover:border-[#2a3a55]"
    >
      {/* Status bar */}
      <div className="flex items-center justify-between border-b border-[#1e2a45] px-3 py-1.5">
        <span
          className={`text-xs font-medium ${
            isCompleted ? "text-[#5a6a7a]" : "text-[#22c55e]"
          }`}
        >
          {statusLabel}
        </span>
        <div className="flex items-center gap-2">
          {game.primetime && (
            <span className="text-xs text-[#d4af37]">{game.primetime}</span>
          )}
          {game.isPlayoff && (
            <span className="text-xs text-[#3b82f6]">Playoff</span>
          )}
        </div>
      </div>

      {/* Away team row */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          awayWon ? "bg-[#d4af37]/5" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/teams/${encodeURIComponent(game.awayTeamName)}`);
            }}
            className="w-10 text-sm font-bold text-[#d4af37] transition-colors hover:text-[#e8c84a]"
          >
            {game.awayTeamAbbr}
          </span>
          <span className="text-xs text-[#5a6a7a]">({awayRecord})</span>
        </div>
        <span
          className={`font-mono text-sm ${
            awayWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"
          }`}
        >
          {isCompleted ? game.awayScore : ""}
        </span>
      </div>

      {/* Home team row */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          homeWon ? "bg-[#d4af37]/5" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/teams/${encodeURIComponent(game.homeTeamName)}`);
            }}
            className="w-10 text-sm font-bold text-[#d4af37] transition-colors hover:text-[#e8c84a]"
          >
            {game.homeTeamAbbr}
          </span>
          <span className="text-xs text-[#5a6a7a]">({homeRecord})</span>
        </div>
        <span
          className={`font-mono text-sm ${
            homeWon ? "font-bold text-[#f0f0f0]" : "text-[#8899aa]"
          }`}
        >
          {isCompleted ? game.homeScore : ""}
        </span>
      </div>

      {/* Betting line footer */}
      {(game.spread != null || game.overUnder != null) && (
        <div className="flex items-center justify-between border-t border-[#1e2a45] px-3 py-1.5">
          <span className="text-xs text-[#5a6a7a]">
            {game.spread != null
              ? `Spread: ${game.homeTeamAbbr} ${game.spread > 0 ? "+" : ""}${game.spread}`
              : ""}
          </span>
          <span className="text-xs text-[#5a6a7a]">
            {game.overUnder != null ? `O/U: ${game.overUnder}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Week section ───────────────────────────────────────

function WeekSection({ weekGroup }: { weekGroup: WeekGroup }) {
  // Group games by day
  const dayGroups = new Map<string, ScorebugEntry[]>();
  for (const entry of weekGroup.games) {
    const day = entry.game.dayOfWeek;
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)!.push(entry);
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-[#e0e0e0]">
        {weekGroup.weekLabel}
        <span className="ml-2 text-sm font-normal text-[#5a6a7a]">
          {weekGroup.season} Season
        </span>
      </h3>

      {Array.from(dayGroups.entries()).map(([day, entries]) => (
        <div key={day} className="mb-6">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[#5a6a7a]">
            {dayFullName(day)}
            {entries[0].game.date && (
              <span className="ml-2 normal-case">
                {formatShortDate(entries[0].game.date)}
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <Scorebug key={entry.game.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────

function dayFullName(abbr: string): string {
  const map: Record<string, string> = {
    Sun: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };
  return map[abbr] ?? abbr;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ─── Main component ─────────────────────────────────────

export default function ScheduleDashboard({
  schedule,
  isLoading,
  isError,
  season,
  week,
  onSeasonChange,
  onWeekChange,
}: ScheduleDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#5a6a7a]">Loading schedule...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#ef4444]">Failed to load schedule.</p>
      </div>
    );
  }

  if (!schedule) return null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Season selector */}
        <select
          value={season ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            onSeasonChange(val);
            onWeekChange(null);
          }}
          className="rounded border border-[#1e2a45] bg-[#141b2d] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
        >
          <option value="">All Seasons</option>
          {schedule.availableSeasons.map((s) => (
            <option key={s} value={String(s)}>
              {s}
            </option>
          ))}
        </select>

        {/* Week selector */}
        {season && (
          <select
            value={week ?? ""}
            onChange={(e) => onWeekChange(e.target.value || null)}
            className="rounded border border-[#1e2a45] bg-[#141b2d] px-3 py-2 text-sm text-[#e0e0e0] focus:border-[#d4af37] focus:outline-none"
          >
            <option value="">All Weeks</option>
            {schedule.availableWeeks.map((w) => (
              <option key={w} value={w}>
                {/^\d+$/.test(w) ? `Week ${w}` : w}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {(season || week) && (
          <button
            onClick={() => {
              onSeasonChange(null);
              onWeekChange(null);
            }}
            className="rounded border border-[#2a3a55] px-3 py-2 text-xs text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
          >
            Clear
          </button>
        )}

        {/* Game count */}
        <span className="ml-auto text-xs text-[#5a6a7a]">
          {schedule.weeks.reduce((n, w) => n + w.games.length, 0)} games
        </span>
      </div>

      {/* Week groups */}
      {schedule.weeks.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-[#1e2a45] bg-[#141b2d] py-16">
          <p className="text-sm text-[#5a6a7a]">No games found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {schedule.weeks.map((wg) => (
            <WeekSection key={`${wg.season}-${wg.week}`} weekGroup={wg} />
          ))}
        </div>
      )}
    </div>
  );
}
