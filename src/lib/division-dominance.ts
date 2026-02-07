/**
 * Pure division dominance analysis — no DB dependency.
 */

export interface DivisionGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeDivision: string;
  awayDivision: string;
  homeConference: string;
  awayConference: string;
  isDivisional: boolean;
}

export interface DivisionRanking {
  division: string;
  wins: number;
  losses: number;
  winPct: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  divisionRecord: string;
}

export interface HeadToHead {
  div1: string;
  div2: string;
  wins: number;
  losses: number;
}

export interface DynastyDivision {
  division: string;
  seasonCount: number;
  avgWinPct: number;
  seasons: number[];
}

export interface SeasonTrend {
  season: number;
  bestDivision: string;
  worstDivision: string;
}

export interface DivisionDominanceResult {
  divisionRankings: DivisionRanking[];
  headToHead: HeadToHead[];
  dynastyDivisions: DynastyDivision[];
  seasonTrends: SeasonTrend[];
}

export function computeDivisionDominance(games: DivisionGame[]): DivisionDominanceResult {
  if (games.length === 0) {
    return {
      divisionRankings: [],
      headToHead: [],
      dynastyDivisions: [],
      seasonTrends: [],
    };
  }

  // Build division statistics
  const divisionMap = new Map<
    string,
    {
      wins: number;
      losses: number;
      pointsFor: number[];
      pointsAgainst: number[];
      allGames: number;
    }
  >();

  for (const g of games) {
    // Home team division
    const homeEntry = divisionMap.get(g.homeDivision) || {
      wins: 0,
      losses: 0,
      pointsFor: [],
      pointsAgainst: [],
      allGames: 0,
    };

    homeEntry.pointsFor.push(g.homeScore);
    homeEntry.pointsAgainst.push(g.awayScore);
    homeEntry.allGames++;

    if (g.homeScore > g.awayScore) {
      homeEntry.wins++;
    } else {
      homeEntry.losses++;
    }

    divisionMap.set(g.homeDivision, homeEntry);

    // Away team division
    const awayEntry = divisionMap.get(g.awayDivision) || {
      wins: 0,
      losses: 0,
      pointsFor: [],
      pointsAgainst: [],
      allGames: 0,
    };

    awayEntry.pointsFor.push(g.awayScore);
    awayEntry.pointsAgainst.push(g.homeScore);
    awayEntry.allGames++;

    if (g.awayScore > g.homeScore) {
      awayEntry.wins++;
    } else {
      awayEntry.losses++;
    }

    divisionMap.set(g.awayDivision, awayEntry);
  }

  // Build division rankings
  const divisionRankings: DivisionRanking[] = [...divisionMap.entries()]
    .map(([division, data]) => {
      const total = data.wins + data.losses;
      const winPct = total > 0 ? parseFloat(((data.wins / total) * 100).toFixed(1)) : 0;
      const avgPointsFor = parseFloat((data.pointsFor.reduce((a, b) => a + b, 0) / data.pointsFor.length).toFixed(1));
      const avgPointsAgainst = parseFloat((data.pointsAgainst.reduce((a, b) => a + b, 0) / data.pointsAgainst.length).toFixed(1));

      return {
        division,
        wins: data.wins,
        losses: data.losses,
        winPct,
        avgPointsFor,
        avgPointsAgainst,
        divisionRecord: `${data.wins}-${data.losses}`,
      };
    })
    .sort((a, b) => b.winPct - a.winPct);

  // Head-to-head: divisions that play each other
  const headToHeadMap = new Map<string, { wins: number; losses: number }>();

  for (const g of games) {
    const key1 = [g.homeDivision, g.awayDivision].sort().join("|");

    if (g.homeDivision !== g.awayDivision) {
      const entry = headToHeadMap.get(key1) || { wins: 0, losses: 0 };

      if (g.homeScore > g.awayScore) {
        entry.wins++;
      } else {
        entry.losses++;
      }

      headToHeadMap.set(key1, entry);
    }
  }

  const headToHead: HeadToHead[] = [...headToHeadMap.entries()]
    .map(([key, data]) => {
      const [div1, div2] = key.split("|");
      return { div1, div2, wins: data.wins, losses: data.losses };
    })
    .sort((a, b) => b.wins - a.wins);

  // Dynasty divisions: divisions with highest winPct across multiple seasons
  const seasonDivisionMap = new Map<
    string,
    {
      seasons: Set<number>;
      winPcts: number[];
    }
  >();

  for (const g of games) {
    // Home division
    const homeKey = g.homeDivision;
    const homeEntry = seasonDivisionMap.get(homeKey) || { seasons: new Set(), winPcts: [] };
    homeEntry.seasons.add(g.season);
    seasonDivisionMap.set(homeKey, homeEntry);

    // Away division
    const awayKey = g.awayDivision;
    const awayEntry = seasonDivisionMap.get(awayKey) || { seasons: new Set(), winPcts: [] };
    awayEntry.seasons.add(g.season);
    seasonDivisionMap.set(awayKey, awayEntry);
  }

  // Recalculate win pct for each season
  const seasonDivisionStats = new Map<string, Map<number, { wins: number; losses: number }>>();

  for (const g of games) {
    // Home team division
    if (!seasonDivisionStats.has(g.homeDivision)) {
      seasonDivisionStats.set(g.homeDivision, new Map());
    }
    const homeMap = seasonDivisionStats.get(g.homeDivision)!;
    const homeSeasonEntry = homeMap.get(g.season) || { wins: 0, losses: 0 };
    if (g.homeScore > g.awayScore) homeSeasonEntry.wins++;
    else homeSeasonEntry.losses++;
    homeMap.set(g.season, homeSeasonEntry);

    // Away team division
    if (!seasonDivisionStats.has(g.awayDivision)) {
      seasonDivisionStats.set(g.awayDivision, new Map());
    }
    const awayMap = seasonDivisionStats.get(g.awayDivision)!;
    const awaySeasonEntry = awayMap.get(g.season) || { wins: 0, losses: 0 };
    if (g.awayScore > g.homeScore) awaySeasonEntry.wins++;
    else awaySeasonEntry.losses++;
    awayMap.set(g.season, awaySeasonEntry);
  }

  const dynastyDivisions: DynastyDivision[] = [...seasonDivisionStats.entries()]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_division, seasonMap]) => seasonMap.size >= 2) // Multiple seasons
    .map(([division, seasonMap]) => {
      const seasons = [...seasonMap.keys()].sort((a, b) => a - b);
      const winPcts: number[] = [];

      for (const stats of seasonMap.values()) {
        const total = stats.wins + stats.losses;
        if (total > 0) {
          winPcts.push((stats.wins / total) * 100);
        }
      }

      const avgWinPct = parseFloat((winPcts.reduce((a, b) => a + b, 0) / winPcts.length).toFixed(1));

      return {
        division,
        seasonCount: seasons.length,
        avgWinPct,
        seasons,
      };
    })
    .sort((a, b) => b.avgWinPct - a.avgWinPct);

  // Season trends: best and worst divisions per season
  const seasonBestWorst = new Map<
    number,
    {
      rankings: Map<string, number>;
    }
  >();

  for (const g of games) {
    if (!seasonBestWorst.has(g.season)) {
      seasonBestWorst.set(g.season, { rankings: new Map() });
    }
    const entry = seasonBestWorst.get(g.season)!;

    // Home
    const homeStats = entry.rankings.get(g.homeDivision) || 0;
    entry.rankings.set(g.homeDivision, homeStats + (g.homeScore > g.awayScore ? 1 : 0));

    // Away
    const awayStats = entry.rankings.get(g.awayDivision) || 0;
    entry.rankings.set(g.awayDivision, awayStats + (g.awayScore > g.homeScore ? 1 : 0));
  }

  const seasonTrends: SeasonTrend[] = [...seasonBestWorst.entries()]
    .map(([season, data]) => {
      const sorted = [...data.rankings.entries()].sort((a, b) => b[1] - a[1]);
      const bestDivision = sorted.length > 0 ? sorted[0][0] : "Unknown";
      const worstDivision = sorted.length > 0 ? sorted[sorted.length - 1][0] : "Unknown";

      return {
        season,
        bestDivision,
        worstDivision,
      };
    })
    .sort((a, b) => a.season - b.season);

  return {
    divisionRankings,
    headToHead,
    dynastyDivisions,
    seasonTrends,
  };
}
