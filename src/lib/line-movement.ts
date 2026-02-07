/**
 * Line Movement Simulation — analyze spread and over/under accuracy.
 * Pure function, no DB dependency.
 */

export interface LineGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  overUnder: number | null;
  spreadResult: string | null;
  ouResult: string | null;
}

interface BinnedOUStats {
  overCount: number;
  underCount: number;
  pushCount: number;
  totalGames: number;
}

export interface OverUnderAccuracy {
  ouRange: string;
  overPct: string;
  underPct: string;
  pushPct: string;
  games: number;
}

export interface SpreadAccuracyByWeek {
  week: number;
  avgAbsError: string;
  games: number;
}

export interface MostProfitableAngle {
  angle: string;
  record: string;
  roi: string;
}

export interface SeasonLineSharpness {
  season: number;
  avgSpreadError: string;
  avgOUError: string;
}

export interface LineMovementResult {
  overUnderAccuracy: OverUnderAccuracy[];
  spreadAccuracyByWeek: SpreadAccuracyByWeek[];
  mostProfitableAngles: MostProfitableAngle[];
  seasonLineSharpness: SeasonLineSharpness[];
}

export function computeLineMovement(games: LineGame[]): LineMovementResult {
  if (games.length === 0) {
    return {
      overUnderAccuracy: [],
      spreadAccuracyByWeek: [],
      mostProfitableAngles: [],
      seasonLineSharpness: [],
    };
  }

  // Group over/under by range (30-35, 35-40, etc.)
  const ouByRangeMap = new Map<string, BinnedOUStats>();
  const spreadErrorsByWeekMap = new Map<
    number,
    { errors: number[]; count: number }
  >();
  const spreadErrorsBySeasonMap = new Map<
    number,
    { spreadErrors: number[]; ouErrors: number[] }
  >();

  // Track betting angles
  const homeUnderdogStats = { wins: 0, losses: 0 };
  const awayUnderdogStats = { wins: 0, losses: 0 };
  const homeFavoriteStats = { wins: 0, losses: 0 };
  const awayFavoriteStats = { wins: 0, losses: 0 };
  const homeUnderStats = { wins: 0, losses: 0 };
  const homeOverStats = { wins: 0, losses: 0 };
  const awayUnderStats = { wins: 0, losses: 0 };
  const awayOverStats = { wins: 0, losses: 0 };

  const spreadRangeMap = new Map<string, { wins: number; losses: number }>();

  for (const g of games) {
    // Process over/under
    if (g.overUnder !== null && g.ouResult !== null) {
      const ouRange = getOURangeKey(g.overUnder);
      if (!ouByRangeMap.has(ouRange)) {
        ouByRangeMap.set(ouRange, {
          overCount: 0,
          underCount: 0,
          pushCount: 0,
          totalGames: 0,
        });
      }
      const stats = ouByRangeMap.get(ouRange)!;
      stats.totalGames++;

      if (g.ouResult === "OVER") {
        stats.overCount++;
      } else if (g.ouResult === "UNDER") {
        stats.underCount++;
      } else {
        stats.pushCount++;
      }

      // Track OU errors
      if (!spreadErrorsBySeasonMap.has(g.season)) {
        spreadErrorsBySeasonMap.set(g.season, { spreadErrors: [], ouErrors: [] });
      }
      const totalPoints = g.homeScore + g.awayScore;
      const ouError = Math.abs(totalPoints - g.overUnder);
      spreadErrorsBySeasonMap.get(g.season)!.ouErrors.push(ouError);
    }

    // Process spread
    if (g.spread !== null) {
      // Initialize week map
      if (!spreadErrorsByWeekMap.has(1)) {
        // Default to week 1 if not found
        spreadErrorsByWeekMap.set(1, { errors: [], count: 0 });
      }

      const totalPointDiff = Math.abs(g.homeScore - g.awayScore);
      const absSpreadError = Math.abs(totalPointDiff - Math.abs(g.spread));

      if (spreadErrorsByWeekMap.has(1)) {
        spreadErrorsByWeekMap.get(1)!.errors.push(absSpreadError);
      } else {
        spreadErrorsByWeekMap.set(1, {
          errors: [absSpreadError],
          count: 1,
        });
      }

      if (!spreadErrorsBySeasonMap.has(g.season)) {
        spreadErrorsBySeasonMap.set(g.season, { spreadErrors: [], ouErrors: [] });
      }
      spreadErrorsBySeasonMap.get(g.season)!.spreadErrors.push(absSpreadError);

      // Track betting angles
      const homeWon = g.homeScore > g.awayScore;
      const spreadMargin = Math.abs(g.spread);
      const spreadAngle = spreadMargin >= 7 ? "3-7" : "< 3";

      if (g.spread < 0) {
        // Home favored
        if (homeWon) {
          homeFavoriteStats.wins++;
        } else {
          homeFavoriteStats.losses++;
        }
        const key = `Home favorite ${spreadAngle}`;
        if (!spreadRangeMap.has(key)) {
          spreadRangeMap.set(key, { wins: 0, losses: 0 });
        }
        if (homeWon) {
          spreadRangeMap.get(key)!.wins++;
        } else {
          spreadRangeMap.get(key)!.losses++;
        }
      } else {
        // Away favored
        if (!homeWon) {
          awayFavoriteStats.wins++;
        } else {
          awayFavoriteStats.losses++;
        }
        const key = `Away favorite ${spreadAngle}`;
        if (!spreadRangeMap.has(key)) {
          spreadRangeMap.set(key, { wins: 0, losses: 0 });
        }
        if (!homeWon) {
          spreadRangeMap.get(key)!.wins++;
        } else {
          spreadRangeMap.get(key)!.losses++;
        }
      }

      if (g.spread > 3) {
        // Home is underdog (away favored by >3)
        if (homeWon) {
          homeUnderdogStats.wins++;
        } else {
          homeUnderdogStats.losses++;
        }
      } else if (g.spread < -3) {
        // Away is underdog (home favored by >3)
        if (!homeWon) {
          awayUnderdogStats.wins++;
        } else {
          awayUnderdogStats.losses++;
        }
      }
    }

    // Track home/away under/over
    if (g.overUnder !== null && g.ouResult !== null) {
      const totalPoints = g.homeScore + g.awayScore;
      if (totalPoints < g.overUnder) {
        homeUnderStats.wins++;
        awayUnderStats.wins++;
      } else {
        homeOverStats.wins++;
        awayOverStats.wins++;
      }
    }
  }

  // Build over/under accuracy
  const overUnderAccuracy: OverUnderAccuracy[] = [...ouByRangeMap]
    .map(([range, stats]) => ({
      ouRange: range,
      overPct:
        stats.totalGames > 0
          ? ((stats.overCount / stats.totalGames) * 100).toFixed(1)
          : "0.0",
      underPct:
        stats.totalGames > 0
          ? ((stats.underCount / stats.totalGames) * 100).toFixed(1)
          : "0.0",
      pushPct:
        stats.totalGames > 0
          ? ((stats.pushCount / stats.totalGames) * 100).toFixed(1)
          : "0.0",
      games: stats.totalGames,
    }))
    .sort((a, b) => {
      const aMin = parseInt(a.ouRange.split("-")[0]);
      const bMin = parseInt(b.ouRange.split("-")[0]);
      return aMin - bMin;
    });

  // Build spread accuracy by week
  const spreadAccuracyByWeek: SpreadAccuracyByWeek[] = [...spreadErrorsByWeekMap]
    .map(([week, data]) => ({
      week,
      avgAbsError:
        data.errors.length > 0
          ? (
              data.errors.reduce((a, b) => a + b, 0) / data.errors.length
            ).toFixed(2)
          : "0.00",
      games: data.errors.length,
    }))
    .sort((a, b) => a.week - b.week);

  // Build most profitable angles
  const angles: { angle: string; wins: number; losses: number }[] = [
    { angle: "Home underdog", wins: homeUnderdogStats.wins, losses: homeUnderdogStats.losses },
    { angle: "Away underdog", wins: awayUnderdogStats.wins, losses: awayUnderdogStats.losses },
    { angle: "Home favorite", wins: homeFavoriteStats.wins, losses: homeFavoriteStats.losses },
    { angle: "Away favorite", wins: awayFavoriteStats.wins, losses: awayFavoriteStats.losses },
    { angle: "Home under", wins: homeUnderStats.wins, losses: homeUnderStats.losses },
    { angle: "Home over", wins: homeOverStats.wins, losses: homeOverStats.losses },
    { angle: "Away under", wins: awayUnderStats.wins, losses: awayUnderStats.losses },
    { angle: "Away over", wins: awayOverStats.wins, losses: awayOverStats.losses },
  ];

  for (const [key, data] of spreadRangeMap) {
    angles.push({ angle: key, wins: data.wins, losses: data.losses });
  }

  const mostProfitableAngles: MostProfitableAngle[] = angles
    .filter((a) => a.wins + a.losses > 0)
    .map((a) => {
      const total = a.wins + a.losses;
      const roi = ((a.wins - a.losses) / total * 100).toFixed(1);
      return {
        angle: a.angle,
        record: `${a.wins}-${a.losses}`,
        roi,
      };
    })
    .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
    .slice(0, 10);

  // Build season line sharpness
  const seasonLineSharpness: SeasonLineSharpness[] = [...spreadErrorsBySeasonMap]
    .map(([season, data]) => ({
      season,
      avgSpreadError:
        data.spreadErrors.length > 0
          ? (
              data.spreadErrors.reduce((a, b) => a + b, 0) /
              data.spreadErrors.length
            ).toFixed(2)
          : "0.00",
      avgOUError:
        data.ouErrors.length > 0
          ? (
              data.ouErrors.reduce((a, b) => a + b, 0) / data.ouErrors.length
            ).toFixed(2)
          : "0.00",
    }))
    .sort((a, b) => b.season - a.season);

  return {
    overUnderAccuracy,
    spreadAccuracyByWeek,
    mostProfitableAngles,
    seasonLineSharpness,
  };
}

function getOURangeKey(ou: number): string {
  const lower = Math.floor(ou / 5) * 5;
  const upper = lower + 5;
  return `${lower}-${upper}`;
}
