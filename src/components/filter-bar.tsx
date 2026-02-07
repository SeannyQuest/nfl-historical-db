"use client";

interface FilterBarProps {
  season: string;
  week: string;
  team: string;
  onSeasonChange: (v: string) => void;
  onWeekChange: (v: string) => void;
  onTeamChange: (v: string) => void;
  onReset: () => void;
  seasons: number[];
  weeks: string[];
  teams: string[];
}

const selectClass =
  "input-glow rounded border border-[#2a3a55] bg-[#0d1321] px-3 py-2 text-sm text-[#e0e0e0] outline-none focus:border-[#d4af37] min-w-[140px]";

export default function FilterBar({
  season,
  week,
  team,
  onSeasonChange,
  onWeekChange,
  onTeamChange,
  onReset,
  seasons,
  weeks,
  teams,
}: FilterBarProps) {
  const hasFilters = season || week || team;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={season}
        onChange={(e) => onSeasonChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by season"
      >
        <option value="">All Seasons</option>
        {seasons.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={week}
        onChange={(e) => onWeekChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by week"
      >
        <option value="">All Weeks</option>
        {weeks.map((w) => (
          <option key={w} value={w}>
            {w === "WildCard" ? "Wild Card" : w === "ConfChamp" ? "Conf. Championship" : w === "SuperBowl" ? "Super Bowl" : `Week ${w}`}
          </option>
        ))}
      </select>

      <select
        value={team}
        onChange={(e) => onTeamChange(e.target.value)}
        className={selectClass}
        aria-label="Filter by team"
      >
        <option value="">All Teams</option>
        {teams.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={onReset}
          className="rounded border border-[#2a3a55] px-3 py-2 text-xs text-[#8899aa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
