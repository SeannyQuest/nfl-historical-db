/**
 * Pure rest advantage computation — no DB dependency.
 * Analyzes how rest days (days between games) affect team performance.
 */

export interface RestGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  dayOfWeek: string;
}

export interface PerformanceStats {
  games: number;
  winPct: string;
  avgMargin: string;
}

export interface TeamRestRecord {
  team: string;
  shortRestWins: number;
  shortRestLosses: number;
  longRestWins: number;
  longRestLosses: number;
}

export interface RestDifferentialImpact {
  restAdvantage: string;
  advantagedTeamWinPct: string;
}

export interface RestAdvantageResult {
  shortRestPerformance: PerformanceStats;
  longRestPerformance: PerformanceStats;
  normalRestPerformance: PerformanceStats;
  teamRestRecords: TeamRestRecord[];
  restDifferentialImpact: RestDifferentialImpact[];
}

// Map day to days of rest (simplified: assuming 7-day weeks)
function getDaysRest(currentDayOfWeek: string, previousDayOfWeek: string): number {
  const dayOrder = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const prevIndex = dayOrder.indexOf(previousDayOfWeek.toLowerCase());
  const currIndex = dayOrder.indexOf(currentDayOfWeek.toLowerCase());

  if (prevIndex === -1 || currIndex === -1) return 7; // Default to 7 if unknown
  const diff = (currIndex - prevIndex + 7) % 7;
  return diff === 0 ? 7 : diff;
}

// Classify rest as short (3-4 days), normal (6-8 days), or long (9+ days)
function classifyRest(daysRest: number): "short" | "normal" | "long" {
  if (daysRest <= 4) return "short";
  if (daysRest <= 8) return "normal";
  return "long";
}

export function computeRestAdvantage(
  games: RestGame[]
): RestAdvantageResult {
  if (games.length === 0) {
    return {
      shortRestPerformance: { games: 0, winPct: "0.000", avgMargin: "0.0" },
      longRestPerformance: { games: 0, winPct: "0.000", avgMargin: "0.0" },
      normalRestPerformance: { games: 0, winPct: "0.000", avgMargin: "0.0" },
      teamRestRecords: [],
      restDifferentialImpact: [],
    };
  }

  // Sort by season and week to track rest properly
  const sortedGames = [...games].sort(
    (a, b) => a.season - b.season || a.week - b.week
  );

  // Track previous game for each team
  const lastGameMap = new Map<string, RestGame>();

  // Track rest performance by category
  const restStats: Record<
    "short" | "normal" | "long",
    {
      wins: number;
      losses: number;
      totalMargin: number;
      games: number;
    }
  > = {
    short: { wins: 0, losses: 0, totalMargin: 0, games: 0 },
    normal: { wins: 0, losses: 0, totalMargin: 0, games: 0 },
    long: { wins: 0, losses: 0, totalMargin: 0, games: 0 },
  };

  // Track per-team rest records
  const teamRestRecordsMap = new Map<string, TeamRestRecord>();

  // Track rest differential matchups
  const restDifferentialMap = new Map<string, { wins: number; games: number }>();

  for (const game of sortedGames) {
    const homeLastGame = lastGameMap.get(game.homeTeamName);
    const awayLastGame = lastGameMap.get(game.awayTeamName);

    const homeRestDays = homeLastGame
      ? getDaysRest(game.dayOfWeek, homeLastGame.dayOfWeek)
      : 7;
    const awayRestDays = awayLastGame
      ? getDaysRest(game.dayOfWeek, awayLastGame.dayOfWeek)
      : 7;

    const homeRestClass = classifyRest(homeRestDays);
    const awayRestClass = classifyRest(awayRestDays);

    const homeWon = game.homeScore > game.awayScore;
    const homeMargin = game.homeScore - game.awayScore;

    // Update rest stats
    if (homeWon) {
      restStats[homeRestClass].wins++;
      restStats[awayRestClass].losses++;
    } else {
      restStats[homeRestClass].losses++;
      restStats[awayRestClass].wins++;
    }
    restStats[homeRestClass].totalMargin += homeMargin;
    restStats[homeRestClass].games++;
    restStats[awayRestClass].totalMargin -= homeMargin;
    restStats[awayRestClass].games++;

    // Update team rest records
    if (!teamRestRecordsMap.has(game.homeTeamName)) {
      teamRestRecordsMap.set(game.homeTeamName, {
        team: game.homeTeamName,
        shortRestWins: 0,
        shortRestLosses: 0,
        longRestWins: 0,
        longRestLosses: 0,
      });
    }
    if (!teamRestRecordsMap.has(game.awayTeamName)) {
      teamRestRecordsMap.set(game.awayTeamName, {
        team: game.awayTeamName,
        shortRestWins: 0,
        shortRestLosses: 0,
        longRestWins: 0,
        longRestLosses: 0,
      });
    }

    const homeRecord = teamRestRecordsMap.get(game.homeTeamName)!;
    const awayRecord = teamRestRecordsMap.get(game.awayTeamName)!;

    if (homeRestClass === "short") {
      if (homeWon) homeRecord.shortRestWins++;
      else homeRecord.shortRestLosses++;
    } else if (homeRestClass === "long") {
      if (homeWon) homeRecord.longRestWins++;
      else homeRecord.longRestLosses++;
    }

    if (awayRestClass === "short") {
      if (!homeWon) awayRecord.shortRestWins++;
      else awayRecord.shortRestLosses++;
    } else if (awayRestClass === "long") {
      if (!homeWon) awayRecord.longRestWins++;
      else awayRecord.longRestLosses++;
    }

    // Track rest differential impact
    if (homeRestClass !== awayRestClass) {
      const advantage =
        homeRestClass === "long"
          ? "Long vs Short"
          : homeRestClass === "normal"
            ? "Normal vs Short"
            : "Short vs Long";
      const key = homeWon ? advantage : reverseAdvantage(advantage);

      if (!restDifferentialMap.has(key)) {
        restDifferentialMap.set(key, { wins: 0, games: 0 });
      }
      const stat = restDifferentialMap.get(key)!;
      if (homeWon) stat.wins++;
      stat.games++;
    }

    // Update last game for both teams
    lastGameMap.set(game.homeTeamName, game);
    lastGameMap.set(game.awayTeamName, game);
  }

  // Compute percentages
  const formatPct = (wins: number, total: number): string => {
    if (total === 0) return "0.000";
    return (wins / total).toFixed(3);
  };

  const formatMargin = (margin: number, games: number): string => {
    if (games === 0) return "0.0";
    return (margin / games).toFixed(1);
  };

  const shortRestPerformance: PerformanceStats = {
    games: restStats.short.games,
    winPct: formatPct(restStats.short.wins, restStats.short.games),
    avgMargin: formatMargin(restStats.short.totalMargin, restStats.short.games),
  };

  const longRestPerformance: PerformanceStats = {
    games: restStats.long.games,
    winPct: formatPct(restStats.long.wins, restStats.long.games),
    avgMargin: formatMargin(restStats.long.totalMargin, restStats.long.games),
  };

  const normalRestPerformance: PerformanceStats = {
    games: restStats.normal.games,
    winPct: formatPct(restStats.normal.wins, restStats.normal.games),
    avgMargin: formatMargin(restStats.normal.totalMargin, restStats.normal.games),
  };

  const restDifferentialImpact: RestDifferentialImpact[] = Array.from(
    restDifferentialMap.entries()
  ).map(([advantage, stats]) => ({
    restAdvantage: advantage,
    advantagedTeamWinPct: formatPct(stats.wins, stats.games),
  }));

  return {
    shortRestPerformance,
    longRestPerformance,
    normalRestPerformance,
    teamRestRecords: Array.from(teamRestRecordsMap.values()),
    restDifferentialImpact,
  };
}

function reverseAdvantage(advantage: string): string {
  if (advantage === "Long vs Short") return "Short vs Long";
  if (advantage === "Long vs Normal") return "Normal vs Long";
  if (advantage === "Normal vs Short") return "Short vs Normal";
  return advantage;
}
