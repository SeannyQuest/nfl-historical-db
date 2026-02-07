/**
 * Pure Monday night factor analysis — no DB dependency.
 * Analyzes primetime games (Monday, Thursday, Sunday nights).
 */

export interface MondayGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  dayOfWeek: string;
  primetime: boolean;
}

export interface DayStats {
  totalGames: number;
  homeWinPct: number;
  avgTotal: number;
  avgMargin: number;
}

export interface DayComparison {
  day: string;
  homeWinPct: number;
  avgTotal: number;
  games: number;
}

export interface TeamMondayRecord {
  team: string;
  mondayWins: number;
  mondayLosses: number;
  mondayWinPct: number;
}

export interface MondayFactorResult {
  mondayNightStats: DayStats;
  thursdayNightStats: DayStats;
  sundayNightStats: DayStats;
  dayComparison: DayComparison[];
  teamMondayRecords: TeamMondayRecord[];
}

function computeDayStats(games: MondayGame[]): DayStats {
  if (games.length === 0) {
    return {
      totalGames: 0,
      homeWinPct: 0,
      avgTotal: 0,
      avgMargin: 0,
    };
  }

  let homeWins = 0;
  let totalScores = 0;
  let totalMargins = 0;

  for (const g of games) {
    if (g.homeScore > g.awayScore) homeWins++;
    totalScores += g.homeScore + g.awayScore;
    totalMargins += Math.abs(g.homeScore - g.awayScore);
  }

  return {
    totalGames: games.length,
    homeWinPct: (homeWins / games.length) * 100,
    avgTotal: totalScores / games.length,
    avgMargin: totalMargins / games.length,
  };
}

function normalizeDay(day: string): string {
  const lower = day.toLowerCase();
  if (lower.includes("mon")) return "Monday";
  if (lower.includes("thu")) return "Thursday";
  if (lower.includes("sun")) return "Sunday";
  return day;
}

export function computeMondayFactor(games: MondayGame[]): MondayFactorResult {
  // Normalize and filter primetime games
  const primetimeGames = games.filter((g) => g.primetime);

  // Group by day of week
  const dayMap = new Map<string, MondayGame[]>();
  for (const g of primetimeGames) {
    const day = normalizeDay(g.dayOfWeek);
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    dayMap.get(day)!.push(g);
  }

  const mondayGames = dayMap.get("Monday") || [];
  const thursdayGames = dayMap.get("Thursday") || [];
  const sundayGames = dayMap.get("Sunday") || [];

  const mondayNightStats = computeDayStats(mondayGames);
  const thursdayNightStats = computeDayStats(thursdayGames);
  const sundayNightStats = computeDayStats(sundayGames);

  // Build day comparison
  const dayComparison: DayComparison[] = [];
  for (const [day, dayGames] of dayMap) {
    const stats = computeDayStats(dayGames);
    dayComparison.push({
      day,
      homeWinPct: stats.homeWinPct,
      avgTotal: stats.avgTotal,
      games: stats.totalGames,
    });
  }
  dayComparison.sort((a, b) => b.games - a.games);

  // Build team Monday records
  const teamMap = new Map<string, { wins: number; losses: number }>();
  for (const g of mondayGames) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    const homeEntry = teamMap.get(g.homeTeamName) || { wins: 0, losses: 0 };
    if (homeWon) homeEntry.wins++;
    else if (awayWon) homeEntry.losses++;
    teamMap.set(g.homeTeamName, homeEntry);

    const awayEntry = teamMap.get(g.awayTeamName) || { wins: 0, losses: 0 };
    if (awayWon) awayEntry.wins++;
    else if (homeWon) awayEntry.losses++;
    teamMap.set(g.awayTeamName, awayEntry);
  }

  const teamMondayRecords: TeamMondayRecord[] = [...teamMap.entries()]
    .map(([team, data]) => ({
      team,
      mondayWins: data.wins,
      mondayLosses: data.losses,
      mondayWinPct:
        data.wins + data.losses > 0 ? (data.wins / (data.wins + data.losses)) * 100 : 0,
    }))
    .sort((a, b) => b.mondayWinPct - a.mondayWinPct);

  return {
    mondayNightStats,
    thursdayNightStats,
    sundayNightStats,
    dayComparison,
    teamMondayRecords,
  };
}
