/**
 * Pure spread accuracy computation — no DB dependency.
 * Analyzes how accurate point spreads were across games and time periods.
 */

export interface SpreadGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
}

export interface SpreadRangeAccuracy {
  range: string; // "PK", "1-3", "3.5-7", "7.5-10", "10+"
  avgError: number;
  games: number;
}

export interface HomeTeamAccuracy {
  team: string;
  avgError: number;
  games: number;
  coverPct: number;
}

export interface SeasonSpreadTrend {
  season: number;
  avgError: number;
  totalGames: number;
}

export interface SpreadAccuracyResult {
  avgAbsError: number;
  spreadRangeAccuracy: SpreadRangeAccuracy[];
  homeTeamAccuracy: HomeTeamAccuracy[];
  seasonTrends: SeasonSpreadTrend[];
}

export function computeSpreadAccuracy(
  games: SpreadGame[]
): SpreadAccuracyResult {
  // Filter to games with spreads
  const gamesWithSpreads = games.filter((g) => g.spread !== null);

  if (gamesWithSpreads.length === 0) {
    return {
      avgAbsError: 0,
      spreadRangeAccuracy: [],
      homeTeamAccuracy: [],
      seasonTrends: [],
    };
  }

  // Compute avg absolute error
  let totalError = 0;
  const errors: Array<{
    game: SpreadGame;
    error: number;
    actualMargin: number;
  }> = [];

  for (const g of gamesWithSpreads) {
    const actualMargin = g.homeScore - g.awayScore;
    const error = Math.abs(actualMargin - (g.spread || 0));
    totalError += error;
    errors.push({ game: g, error, actualMargin });
  }

  const avgAbsError = totalError / gamesWithSpreads.length;

  // Spread range accuracy
  const rangeMap = new Map<
    string,
    { errors: number[]; count: number }
  >();
  const ranges = ["PK", "1-3", "3.5-7", "7.5-10", "10+"];
  for (const r of ranges) {
    rangeMap.set(r, { errors: [], count: 0 });
  }

  for (const { game, error } of errors) {
    const spread = Math.abs(game.spread || 0);
    let range = "10+";
    if (spread === 0) range = "PK";
    else if (spread > 0 && spread <= 3) range = "1-3";
    else if (spread > 3 && spread <= 7) range = "3.5-7";
    else if (spread > 7 && spread <= 10) range = "7.5-10";

    const r = rangeMap.get(range)!;
    r.errors.push(error);
    r.count++;
  }

  const spreadRangeAccuracy: SpreadRangeAccuracy[] = ranges
    .map((range) => {
      const data = rangeMap.get(range)!;
      const avgError =
        data.errors.length > 0
          ? data.errors.reduce((a, b) => a + b, 0) / data.errors.length
          : 0;
      return {
        range,
        avgError: Math.round(avgError * 100) / 100,
        games: data.count,
      };
    })
    .filter((r) => r.games > 0);

  // Home team accuracy
  const teamMap = new Map<
    string,
    { errors: number[]; count: number; covered: number }
  >();

  for (const { game, error } of errors) {
    const homeTeam = game.homeTeamName;
    if (!teamMap.has(homeTeam)) {
      teamMap.set(homeTeam, { errors: [], count: 0, covered: 0 });
    }
    const t = teamMap.get(homeTeam)!;
    t.errors.push(error);
    t.count++;
    // Home team covers if actual margin >= spread (spread is positive for home favorite)
    if (game.homeScore - game.awayScore >= (game.spread || 0)) {
      t.covered++;
    }
  }

  const homeTeamAccuracy: HomeTeamAccuracy[] = Array.from(teamMap.entries())
    .map(([team, data]) => ({
      team,
      avgError: Math.round(
        (data.errors.reduce((a, b) => a + b, 0) / data.count) * 100
      ) / 100,
      games: data.count,
      coverPct: Math.round((data.covered / data.count) * 10000) / 10000,
    }))
    .sort((a, b) => a.avgError - b.avgError);

  // Season trends
  const seasonMap = new Map<
    number,
    { errors: number[]; count: number }
  >();

  for (const { game, error } of errors) {
    if (!seasonMap.has(game.season)) {
      seasonMap.set(game.season, { errors: [], count: 0 });
    }
    const s = seasonMap.get(game.season)!;
    s.errors.push(error);
    s.count++;
  }

  const seasonTrends: SeasonSpreadTrend[] = Array.from(seasonMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      avgError: Math.round(
        (data.errors.reduce((a, b) => a + b, 0) / data.count) * 100
      ) / 100,
      totalGames: data.count,
    }));

  return {
    avgAbsError: Math.round(avgAbsError * 100) / 100,
    spreadRangeAccuracy,
    homeTeamAccuracy,
    seasonTrends,
  };
}
