/**
 * Pure pick-em tracker — no DB dependency.
 * Pick-em = spread is 0 or very close (abs <= 1)
 */

export interface PickEmGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
}

export interface PickEmStats {
  count: number;
  homeWinPct: number;
}

export interface CloseSpreadStats {
  count: number;
  homeWinPct: number;
  avgMargin: number;
}

export interface BigSpreadStats {
  count: number;
  favoriteWinPct: number;
  avgMargin: number;
}

export interface SpreadDistribution {
  range: string;
  count: number;
  pct: number;
}

export interface PickEmTrackerResult {
  pickEmGames: PickEmStats;
  closeSpreadGames: CloseSpreadStats;
  bigSpreadGames: BigSpreadStats;
  spreadDistribution: SpreadDistribution[];
}

export function computePickEmTracker(games: PickEmGame[]): PickEmTrackerResult {
  // Filter games with spread data
  const gamesWithSpread = games.filter((g) => g.spread !== null);

  // Pick-em games: abs(spread) <= 1
  const pickEmGames = gamesWithSpread.filter((g) => Math.abs(g.spread!) <= 1);

  // Close spread games: abs(spread) <= 3
  const closeSpreadGames = gamesWithSpread.filter((g) => Math.abs(g.spread!) <= 3);

  // Big spread games: abs(spread) >= 10
  const bigSpreadGames = gamesWithSpread.filter((g) => Math.abs(g.spread!) >= 10);

  // Compute pick-em stats
  let pickEmHomeWins = 0;
  for (const g of pickEmGames) {
    if (g.homeScore > g.awayScore) pickEmHomeWins++;
  }
  const pickEmStats: PickEmStats = {
    count: pickEmGames.length,
    homeWinPct: pickEmGames.length > 0 ? (pickEmHomeWins / pickEmGames.length) * 100 : 0,
  };

  // Compute close spread stats
  let closeHomeWins = 0;
  let closeMargins = 0;
  for (const g of closeSpreadGames) {
    if (g.homeScore > g.awayScore) closeHomeWins++;
    closeMargins += Math.abs(g.homeScore - g.awayScore);
  }
  const closeSpreadStats: CloseSpreadStats = {
    count: closeSpreadGames.length,
    homeWinPct: closeSpreadGames.length > 0 ? (closeHomeWins / closeSpreadGames.length) * 100 : 0,
    avgMargin: closeSpreadGames.length > 0 ? closeMargins / closeSpreadGames.length : 0,
  };

  // Compute big spread stats (favorite win pct)
  // Positive spread = favorite is home team; negative spread = favorite is away team
  let bigFavoriteWins = 0;
  let bigMargins = 0;
  for (const g of bigSpreadGames) {
    const spread = g.spread!;
    const homeIsFavorite = spread > 0;

    if (homeIsFavorite) {
      // Home team is favorite
      if (g.homeScore > g.awayScore) bigFavoriteWins++;
    } else {
      // Away team is favorite
      if (g.awayScore > g.homeScore) bigFavoriteWins++;
    }
    bigMargins += Math.abs(g.homeScore - g.awayScore);
  }
  const bigSpreadStats: BigSpreadStats = {
    count: bigSpreadGames.length,
    favoriteWinPct: bigSpreadGames.length > 0 ? (bigFavoriteWins / bigSpreadGames.length) * 100 : 0,
    avgMargin: bigSpreadGames.length > 0 ? bigMargins / bigSpreadGames.length : 0,
  };

  // Compute spread distribution
  const distributionMap = new Map<string, number>();
  for (const g of gamesWithSpread) {
    const absSpread = Math.abs(g.spread!);
    let range = "";

    if (absSpread <= 1) range = "Pick-em (±0-1)";
    else if (absSpread <= 3) range = "Close (±1.5-3)";
    else if (absSpread <= 7) range = "Medium (±3.5-7)";
    else if (absSpread <= 14) range = "Large (±7.5-14)";
    else range = "Huge (±14+)";

    distributionMap.set(range, (distributionMap.get(range) || 0) + 1);
  }

  const spreadDistribution: SpreadDistribution[] = [
    "Pick-em (±0-1)",
    "Close (±1.5-3)",
    "Medium (±3.5-7)",
    "Large (±7.5-14)",
    "Huge (±14+)",
  ]
    .map((range) => ({
      range,
      count: distributionMap.get(range) || 0,
      pct: gamesWithSpread.length > 0 ? ((distributionMap.get(range) || 0) / gamesWithSpread.length) * 100 : 0,
    }))
    .filter((d) => d.count > 0);

  return {
    pickEmGames: pickEmStats,
    closeSpreadGames: closeSpreadStats,
    bigSpreadGames: bigSpreadStats,
    spreadDistribution,
  };
}
