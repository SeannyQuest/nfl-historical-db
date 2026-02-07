/**
 * Pure rivalry heat map computation — no DB dependency.
 * Analyzes divisional rivalries and head-to-head matchup intensity.
 */

export interface RivalryHeatGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeDivision: string;
  awayDivision: string;
}

export interface RivalryMatchup {
  team1: string;
  team2: string;
  games: number;
  avgMargin: string;
  avgTotal: string;
  oneScoreGames: number;
  oneScorePct: string;
}

export interface DivisionRivalryStats {
  division: string;
  avgMargin: string;
  avgTotal: string;
  games: number;
}

export interface RivalryHeatmapResult {
  rivalryIntensity: RivalryMatchup[];
  hottestRivalries: RivalryMatchup[];
  highestScoringRivalries: RivalryMatchup[];
  divisionRivalryStats: DivisionRivalryStats[];
}

// Normalize team names in matchups (sort alphabetically so A-B = B-A)
function normalizeMatchup(team1: string, team2: string): string {
  const teams = [team1, team2].sort();
  return `${teams[0]}|${teams[1]}`;
}

export function computeRivalryHeatmap(
  games: RivalryHeatGame[]
): RivalryHeatmapResult {
  if (games.length === 0) {
    return {
      rivalryIntensity: [],
      hottestRivalries: [],
      highestScoringRivalries: [],
      divisionRivalryStats: [],
    };
  }

  // Filter only divisional games (same division)
  const divisionalGames = games.filter(
    (g) => g.homeDivision === g.awayDivision
  );

  if (divisionalGames.length === 0) {
    return {
      rivalryIntensity: [],
      hottestRivalries: [],
      highestScoringRivalries: [],
      divisionRivalryStats: [],
    };
  }

  // Track head-to-head matchups
  const matchupMap = new Map<
    string,
    {
      games: number;
      totalMargin: number;
      totalPoints: number;
      oneScoreGames: number;
    }
  >();

  // Track division stats
  const divisionStatsMap = new Map<
    string,
    {
      games: number;
      totalMargin: number;
      totalPoints: number;
    }
  >();

  for (const game of divisionalGames) {
    const matchupKey = normalizeMatchup(
      game.homeTeamName,
      game.awayTeamName
    );
    const margin = Math.abs(game.homeScore - game.awayScore);
    const total = game.homeScore + game.awayScore;

    if (!matchupMap.has(matchupKey)) {
      matchupMap.set(matchupKey, {
        games: 0,
        totalMargin: 0,
        totalPoints: 0,
        oneScoreGames: 0,
      });
    }
    const stats = matchupMap.get(matchupKey)!;
    stats.games++;
    stats.totalMargin += margin;
    stats.totalPoints += total;
    if (margin <= 3) stats.oneScoreGames++;

    // Division stats
    const division = game.homeDivision;
    if (!divisionStatsMap.has(division)) {
      divisionStatsMap.set(division, {
        games: 0,
        totalMargin: 0,
        totalPoints: 0,
      });
    }
    const divStats = divisionStatsMap.get(division)!;
    divStats.games++;
    divStats.totalMargin += margin;
    divStats.totalPoints += total;
  }

  // Build rivalry intensity list
  const rivalryIntensity: RivalryMatchup[] = Array.from(
    matchupMap.entries()
  ).map(([key, stats]) => {
    const [team1, team2] = key.split("|");
    return {
      team1,
      team2,
      games: stats.games,
      avgMargin: (stats.totalMargin / stats.games).toFixed(1),
      avgTotal: (stats.totalPoints / stats.games).toFixed(1),
      oneScoreGames: stats.oneScoreGames,
      oneScorePct: ((stats.oneScoreGames / stats.games) * 100).toFixed(1),
    };
  });

  // Sort by margin (lowest = most competitive)
  const hottestRivalries = [...rivalryIntensity]
    .sort(
      (a, b) =>
        parseFloat(a.avgMargin) - parseFloat(b.avgMargin)
    )
    .slice(0, 10);

  // Sort by total points (highest scoring)
  const highestScoringRivalries = [...rivalryIntensity]
    .sort(
      (a, b) =>
        parseFloat(b.avgTotal) - parseFloat(a.avgTotal)
    )
    .slice(0, 10);

  // Build division stats
  const divisionRivalryStats: DivisionRivalryStats[] = Array.from(
    divisionStatsMap.entries()
  ).map(([division, stats]) => ({
    division,
    avgMargin: (stats.totalMargin / stats.games).toFixed(1),
    avgTotal: (stats.totalPoints / stats.games).toFixed(1),
    games: stats.games,
  }));

  return {
    rivalryIntensity,
    hottestRivalries,
    highestScoringRivalries,
    divisionRivalryStats,
  };
}
