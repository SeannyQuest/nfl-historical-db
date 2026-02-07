/**
 * Pure schedule computation — groups games by week with scorebug data.
 * No database dependency; fully testable with plain objects.
 */

// ─── Types ──────────────────────────────────────────────

export interface ScheduleGame {
  id: string;
  date: string;
  season: number;
  week: string;
  time: string | null;
  dayOfWeek: string;
  isPlayoff: boolean;
  primetime: string | null;
  homeTeamName: string;
  homeTeamAbbr: string;
  homeTeamCity: string;
  awayTeamName: string;
  awayTeamAbbr: string;
  awayTeamCity: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  spread: number | null;
  overUnder: number | null;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface ScorebugEntry {
  game: ScheduleGame;
  homeRecord: string;
  awayRecord: string;
  statusLabel: string; // "Final", "Final OT", "TIE", or time like "1:00 PM ET"
}

export interface WeekGroup {
  season: number;
  week: string;
  weekLabel: string; // "Week 1", "Wild Card", etc.
  games: ScorebugEntry[];
}

export interface ScheduleResult {
  weeks: WeekGroup[];
  availableSeasons: number[];
  availableWeeks: string[];
}

// ─── Week ordering ──────────────────────────────────────

const WEEK_ORDER: Record<string, number> = {
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "10": 10, "11": 11, "12": 12, "13": 13, "14": 14, "15": 15, "16": 16,
  "17": 17, "18": 18,
  "WildCard": 19, "Division": 20, "ConfChamp": 21, "SuperBowl": 22,
};

function weekOrder(week: string): number {
  return WEEK_ORDER[week] ?? 99;
}

export function weekLabel(week: string): string {
  if (/^\d+$/.test(week)) return `Week ${week}`;
  if (week === "WildCard") return "Wild Card";
  if (week === "Division") return "Divisional";
  if (week === "ConfChamp") return "Conference Championship";
  if (week === "SuperBowl") return "Super Bowl";
  return week;
}

// ─── Day ordering ───────────────────────────────────────

const DAY_ORDER: Record<string, number> = {
  Thu: 0, Fri: 1, Sat: 2, Sun: 3, Mon: 4, Tue: 5, Wed: 6,
};

function dayOrder(day: string): number {
  return DAY_ORDER[day] ?? 99;
}

// ─── Status label ───────────────────────────────────────

function computeStatusLabel(game: ScheduleGame): string {
  if (game.homeScore === 0 && game.awayScore === 0 && !game.winnerName) {
    // Upcoming game (no score yet)
    return game.time ? `${game.time} ET` : "TBD";
  }
  if (!game.winnerName && game.homeScore === game.awayScore) {
    return "TIE";
  }
  return "Final";
}

// ─── Team records computation ───────────────────────────

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

function computeTeamRecords(
  allGames: ScheduleGame[],
  season: number
): Map<string, TeamRecord> {
  const records = new Map<string, TeamRecord>();

  const seasonGames = allGames.filter(
    (g) => g.season === season && !g.isPlayoff
  );

  for (const game of seasonGames) {
    // Skip unplayed games (both scores 0, no winner)
    if (game.homeScore === 0 && game.awayScore === 0 && !game.winnerName) {
      continue;
    }

    if (!records.has(game.homeTeamName)) {
      records.set(game.homeTeamName, { wins: 0, losses: 0, ties: 0 });
    }
    if (!records.has(game.awayTeamName)) {
      records.set(game.awayTeamName, { wins: 0, losses: 0, ties: 0 });
    }

    const homeRec = records.get(game.homeTeamName)!;
    const awayRec = records.get(game.awayTeamName)!;

    if (game.winnerName === game.homeTeamName) {
      homeRec.wins++;
      awayRec.losses++;
    } else if (game.winnerName === game.awayTeamName) {
      awayRec.wins++;
      homeRec.losses++;
    } else {
      homeRec.ties++;
      awayRec.ties++;
    }
  }

  return records;
}

function formatRecord(rec: TeamRecord | undefined): string {
  if (!rec) return "0-0";
  if (rec.ties > 0) return `${rec.wins}-${rec.losses}-${rec.ties}`;
  return `${rec.wins}-${rec.losses}`;
}

// ─── Main computation ───────────────────────────────────

export function computeSchedule(
  games: ScheduleGame[],
  filterSeason?: number | null,
  filterWeek?: string | null
): ScheduleResult {
  // Available seasons (descending)
  const seasonSet = new Set<number>();
  for (const g of games) seasonSet.add(g.season);
  const availableSeasons = Array.from(seasonSet).sort((a, b) => b - a);

  // Filter to requested season
  let filtered = games;
  if (filterSeason != null) {
    filtered = filtered.filter((g) => g.season === filterSeason);
  }

  // Available weeks for the filtered season
  const weekSet = new Set<string>();
  for (const g of filtered) weekSet.add(g.week);
  const availableWeeks = Array.from(weekSet).sort(
    (a, b) => weekOrder(a) - weekOrder(b)
  );

  // Filter to requested week
  if (filterWeek != null) {
    filtered = filtered.filter((g) => g.week === filterWeek);
  }

  // Compute team records for each season present in filtered games
  const seasonRecords = new Map<number, Map<string, TeamRecord>>();
  const filteredSeasons = new Set<number>();
  for (const g of filtered) filteredSeasons.add(g.season);
  for (const s of filteredSeasons) {
    // Use all games (not filtered) to compute full-season records
    seasonRecords.set(s, computeTeamRecords(games, s));
  }

  // Group by season+week
  const weekMap = new Map<string, ScheduleGame[]>();
  for (const g of filtered) {
    const key = `${g.season}::${g.week}`;
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(g);
  }

  // Sort weeks by season desc, then week order asc
  const sortedKeys = Array.from(weekMap.keys()).sort((a, b) => {
    const [sA, wA] = a.split("::");
    const [sB, wB] = b.split("::");
    const seasonDiff = parseInt(sB) - parseInt(sA);
    if (seasonDiff !== 0) return seasonDiff;
    return weekOrder(wA) - weekOrder(wB);
  });

  const weeks: WeekGroup[] = sortedKeys.map((key) => {
    const [seasonStr, week] = key.split("::");
    const season = parseInt(seasonStr);
    const weekGames = weekMap.get(key)!;
    const records = seasonRecords.get(season);

    // Sort games within week: by day order, then by time, then by date
    weekGames.sort((a, b) => {
      const dayDiff = dayOrder(a.dayOfWeek) - dayOrder(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      // Sort by time (null last)
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const scorebugEntries: ScorebugEntry[] = weekGames.map((game) => ({
      game,
      homeRecord: formatRecord(records?.get(game.homeTeamName)),
      awayRecord: formatRecord(records?.get(game.awayTeamName)),
      statusLabel: computeStatusLabel(game),
    }));

    return {
      season,
      week,
      weekLabel: weekLabel(week),
      games: scorebugEntries,
    };
  });

  return { weeks, availableSeasons, availableWeeks };
}
