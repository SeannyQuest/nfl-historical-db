/**
 * Scoring Drought Analysis — track consecutive games where teams score < 14 points.
 * Pure function, no DB dependency.
 */

export interface DroughtGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamDrought {
  team: string;
  season: number;
  longestDrought: number;
  droughtGames: {
    fromWeek: number;
    toWeek: number;
    gamesCount: number;
  }[];
}

export interface WorstDrought {
  team: string;
  season: number;
  length: number;
  fromWeek: number;
  toWeek: number;
}

export interface ShutoutFrequencyRecord {
  season: number;
  shutouts: number;
  shutoutPct: string;
}

export interface ScoringDroughtResult {
  teamDroughts: TeamDrought[];
  worstDroughts: WorstDrought[];
  shutoutFrequency: ShutoutFrequencyRecord[];
}

export function computeScoringDroughts(games: DroughtGame[]): ScoringDroughtResult {
  if (games.length === 0) {
    return {
      teamDroughts: [],
      worstDroughts: [],
      shutoutFrequency: [],
    };
  }

  // Track droughts by team
  const teamDroughtMap = new Map<
    string,
    Map<
      number,
      {
        allDroughts: { fromWeek: number; toWeek: number; gamesCount: number }[];
        currentDrought: { startWeek: number; games: number } | null;
      }
    >
  >();

  // Track shutouts
  const shutoutsBySeasonMap = new Map<
    number,
    { shutouts: number; totalGames: number }
  >();

  // Process games
  for (const g of games) {
    // Initialize season maps if needed
    if (!shutoutsBySeasonMap.has(g.season)) {
      shutoutsBySeasonMap.set(g.season, { shutouts: 0, totalGames: 0 });
    }
    shutoutsBySeasonMap.get(g.season)!.totalGames++;

    // Check for shutouts (one team scores 0)
    if (g.homeScore === 0 || g.awayScore === 0) {
      shutoutsBySeasonMap.get(g.season)!.shutouts++;
    }

    // Track droughts for home team
    if (!teamDroughtMap.has(g.homeTeamName)) {
      teamDroughtMap.set(g.homeTeamName, new Map());
    }
    const homeSeasonMap = teamDroughtMap.get(g.homeTeamName)!;
    if (!homeSeasonMap.has(g.season)) {
      homeSeasonMap.set(g.season, { allDroughts: [], currentDrought: null });
    }
    const homeEntry = homeSeasonMap.get(g.season)!;

    if (g.homeScore < 14) {
      if (!homeEntry.currentDrought) {
        homeEntry.currentDrought = { startWeek: g.week, games: 1 };
      } else {
        homeEntry.currentDrought.games++;
      }
    } else {
      if (homeEntry.currentDrought) {
        homeEntry.allDroughts.push({
          fromWeek: homeEntry.currentDrought.startWeek,
          toWeek: g.week - 1,
          gamesCount: homeEntry.currentDrought.games,
        });
        homeEntry.currentDrought = null;
      }
    }

    // Track droughts for away team
    if (!teamDroughtMap.has(g.awayTeamName)) {
      teamDroughtMap.set(g.awayTeamName, new Map());
    }
    const awaySeasonMap = teamDroughtMap.get(g.awayTeamName)!;
    if (!awaySeasonMap.has(g.season)) {
      awaySeasonMap.set(g.season, { allDroughts: [], currentDrought: null });
    }
    const awayEntry = awaySeasonMap.get(g.season)!;

    if (g.awayScore < 14) {
      if (!awayEntry.currentDrought) {
        awayEntry.currentDrought = { startWeek: g.week, games: 1 };
      } else {
        awayEntry.currentDrought.games++;
      }
    } else {
      if (awayEntry.currentDrought) {
        awayEntry.allDroughts.push({
          fromWeek: awayEntry.currentDrought.startWeek,
          toWeek: g.week - 1,
          gamesCount: awayEntry.currentDrought.games,
        });
        awayEntry.currentDrought = null;
      }
    }
  }

  // Finalize droughts (handle ongoing droughts at end of data)
  for (const [team, seasonMap] of teamDroughtMap) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [_season, entry] of seasonMap) {
      if (entry.currentDrought) {
        const lastWeek = Math.max(
          ...games.filter((g) => g.homeTeamName === team || g.awayTeamName === team)
            .map((g) => g.week)
        );
        entry.allDroughts.push({
          fromWeek: entry.currentDrought.startWeek,
          toWeek: lastWeek,
          gamesCount: entry.currentDrought.games,
        });
      }
    }
  }

  // Build team droughts array
  const teamDroughts: TeamDrought[] = [];
  for (const [team, seasonMap] of teamDroughtMap) {
    for (const [season, entry] of seasonMap) {
      const longestDrought =
        entry.allDroughts.length > 0
          ? Math.max(...entry.allDroughts.map((d) => d.gamesCount))
          : 0;

      if (entry.allDroughts.length > 0) {
        teamDroughts.push({
          team,
          season,
          longestDrought,
          droughtGames: entry.allDroughts,
        });
      }
    }
  }

  // Build worst droughts (top 10 across all teams/seasons)
  const allDroughts: WorstDrought[] = [];
  for (const td of teamDroughts) {
    for (const dg of td.droughtGames) {
      allDroughts.push({
        team: td.team,
        season: td.season,
        length: dg.gamesCount,
        fromWeek: dg.fromWeek,
        toWeek: dg.toWeek,
      });
    }
  }
  const worstDroughts = allDroughts
    .sort((a, b) => b.length - a.length)
    .slice(0, 10);

  // Build shutout frequency
  const shutoutFrequency: ShutoutFrequencyRecord[] = [...shutoutsBySeasonMap]
    .map(([season, data]) => ({
      season,
      shutouts: data.shutouts,
      shutoutPct:
        data.totalGames > 0 ? ((data.shutouts / data.totalGames) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.season - a.season);

  return {
    teamDroughts,
    worstDroughts,
    shutoutFrequency,
  };
}
