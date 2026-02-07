/**
 * Pure function for ATS trend analysis — against the spread metrics — no DB dependency.
 */

export interface ATSTrendGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  spreadResult: string | null;
}

export interface MonthlyATS {
  month: string;
  homeCovers: number;
  awayCovers: number;
  homeCoverPct: string;
}

export interface WeeklyATS {
  week: number;
  homeCoverPct: string;
  games: number;
}

export interface DogVsFavATS {
  underdogCoverPct: string;
  favoriteCoverPct: string;
  underdogGames: number;
}

export interface SpreadRangeATS {
  range: string;
  homeCoverPct: string;
  awayCoverPct: string;
  games: number;
}

export interface SeasonATS {
  season: number;
  homeCoverPct: string;
  totalGames: number;
}

export interface ATSTrendsResult {
  monthlyATS: MonthlyATS[];
  weeklyATS: WeeklyATS[];
  dogVsFavATS: DogVsFavATS;
  spreadRangeATS: SpreadRangeATS[];
  seasonATS: SeasonATS[];
}

function getMonthName(week: number): string {
  // Simplified: treat weeks as months (NFL season weeks 1-17 + playoffs)
  if (week >= 1 && week <= 4) return "September";
  if (week >= 5 && week <= 8) return "October";
  if (week >= 9 && week <= 13) return "November";
  if (week >= 14 && week <= 17) return "December";
  return "January+"; // Playoffs
}

function getSpreadRange(spread: number): string {
  const abs = Math.abs(spread);
  if (abs >= 0.5 && abs < 3) return "0.5-3";
  if (abs >= 3 && abs < 7) return "3-7";
  if (abs >= 7 && abs < 14) return "7-14";
  return "14+";
}

export function computeATSTrends(games: ATSTrendGame[]): ATSTrendsResult {
  const monthlyMap = new Map<string, { homeCovers: number; awayCovers: number }>();
  const weeklyMap = new Map<number, { homeCovers: number; awayCovers: number; games: number }>();
  const spreadRangeMap = new Map<
    string,
    { homeCovers: number; awayCovers: number; games: number }
  >();
  const seasonMap = new Map<number, { totalCovers: number; totalGames: number }>();

  let underdogCovers = 0;
  let underdogGames = 0;
  let favoriteCovers = 0;
  let favoriteGames = 0;

  for (const g of games) {
    // Skip games without spread data
    if (g.spread === null || g.spread === 0 || g.spreadResult === null) {
      continue;
    }

    const covered = g.spreadResult === "COVERED";

    // Monthly ATS
    const month = getMonthName(g.week);
    if (!monthlyMap.has(month)) {
      monthlyMap.set(month, { homeCovers: 0, awayCovers: 0 });
    }
    const monthData = monthlyMap.get(month)!;
    if (covered) {
      // Determine if home or away was favored and covered
      if (g.spread > 0) {
        // Home favored
        const margin = g.homeScore - g.awayScore;
        if (margin >= g.spread) {
          monthData.homeCovers++;
        } else {
          monthData.awayCovers++;
        }
      } else {
        // Away favored
        const margin = g.awayScore - g.homeScore;
        if (margin >= -g.spread) {
          monthData.awayCovers++;
        } else {
          monthData.homeCovers++;
        }
      }
    }

    // Weekly ATS
    if (!weeklyMap.has(g.week)) {
      weeklyMap.set(g.week, { homeCovers: 0, awayCovers: 0, games: 0 });
    }
    const weekData = weeklyMap.get(g.week)!;
    weekData.games++;
    if (covered) {
      if (g.spread > 0) {
        const margin = g.homeScore - g.awayScore;
        if (margin >= g.spread) weekData.homeCovers++;
        else weekData.awayCovers++;
      } else {
        const margin = g.awayScore - g.homeScore;
        if (margin >= -g.spread) weekData.awayCovers++;
        else weekData.homeCovers++;
      }
    }

    // Dog vs Fav
    if (g.spread > 0) {
      // Home favored by g.spread, away is dog
      underdogGames++;
      favoriteGames++;
      if (covered) {
        const margin = g.homeScore - g.awayScore;
        if (margin >= g.spread) {
          // Home covered the spread (favorite)
          favoriteCovers++;
        } else {
          // Away covered the spread (underdog)
          underdogCovers++;
        }
      }
    } else {
      // Away favored by -g.spread, home is dog
      underdogGames++;
      favoriteGames++;
      if (covered) {
        const margin = g.awayScore - g.homeScore;
        if (margin >= -g.spread) {
          // Away covered the spread (favorite)
          favoriteCovers++;
        } else {
          // Home covered the spread (underdog)
          underdogCovers++;
        }
      }
    }

    // Spread range ATS
    const range = getSpreadRange(g.spread);
    if (!spreadRangeMap.has(range)) {
      spreadRangeMap.set(range, { homeCovers: 0, awayCovers: 0, games: 0 });
    }
    const rangeData = spreadRangeMap.get(range)!;
    rangeData.games++;
    if (covered) {
      if (g.spread > 0) {
        const margin = g.homeScore - g.awayScore;
        if (margin >= g.spread) rangeData.homeCovers++;
        else rangeData.awayCovers++;
      } else {
        const margin = g.awayScore - g.homeScore;
        if (margin >= -g.spread) rangeData.awayCovers++;
        else rangeData.homeCovers++;
      }
    }

    // Season ATS
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { totalCovers: 0, totalGames: 0 });
    }
    const seasonData = seasonMap.get(g.season)!;
    seasonData.totalGames++;
    if (covered) {
      seasonData.totalCovers++;
    }
  }

  // Convert to result types
  const monthlyATS: MonthlyATS[] = Array.from(monthlyMap.entries())
    .map(([month, data]) => {
      const total = data.homeCovers + data.awayCovers;
      return {
        month,
        homeCovers: data.homeCovers,
        awayCovers: data.awayCovers,
        homeCoverPct: total > 0 ? (data.homeCovers / total).toFixed(3) : "0.000",
      };
    })
    .sort((a, b) => {
      const order = ["September", "October", "November", "December", "January+"];
      return order.indexOf(a.month) - order.indexOf(b.month);
    });

  const weeklyATS: WeeklyATS[] = Array.from(weeklyMap.entries())
    .map(([week, data]) => ({
      week,
      homeCoverPct: data.games > 0 ? (data.homeCovers / data.games).toFixed(3) : "0.000",
      games: data.games,
    }))
    .sort((a, b) => a.week - b.week);

  const dogVsFavATS: DogVsFavATS = {
    underdogCoverPct: underdogGames > 0 ? (underdogCovers / underdogGames).toFixed(3) : "0.000",
    favoriteCoverPct: favoriteGames > 0 ? (favoriteCovers / favoriteGames).toFixed(3) : "0.000",
    underdogGames,
  };

  const spreadRangeATS: SpreadRangeATS[] = Array.from(spreadRangeMap.entries())
    .map(([range, data]) => ({
      range,
      homeCoverPct: data.games > 0 ? (data.homeCovers / data.games).toFixed(3) : "0.000",
      awayCoverPct: data.games > 0 ? (data.awayCovers / data.games).toFixed(3) : "0.000",
      games: data.games,
    }))
    .sort((a, b) => {
      const order = ["0.5-3", "3-7", "7-14", "14+"];
      return order.indexOf(a.range) - order.indexOf(b.range);
    });

  const seasonATS: SeasonATS[] = Array.from(seasonMap.entries())
    .map(([season, data]) => ({
      season,
      homeCoverPct: data.totalGames > 0 ? (data.totalCovers / data.totalGames).toFixed(3) : "0.000",
      totalGames: data.totalGames,
    }))
    .sort((a, b) => a.season - b.season);

  return {
    monthlyATS,
    weeklyATS,
    dogVsFavATS,
    spreadRangeATS,
    seasonATS,
  };
}
