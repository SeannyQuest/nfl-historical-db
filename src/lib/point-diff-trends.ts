/**
 * Pure point differential trends computation — no DB dependency.
 * Analyzes point differential trends, Pythagorean wins, and league trends.
 */

export interface PointDiffGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface PointDiffEntry {
  week: number;
  pointDiff: number;
  cumulative: number;
}

export interface TeamPointDiffTrend {
  team: string;
  season: number;
  cumulativePointDiff: PointDiffEntry[];
}

export interface BestPointDiffTeamSeason {
  team: string;
  season: number;
  totalPointDiff: number;
  gamesPlayed: number;
  avgPointDiffPerGame: number;
}

export interface PythagoreanWins {
  team: string;
  season: number;
  actualWins: number;
  expectedWins: number;
  diff: number;
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
}

export interface LeagueTrend {
  season: number;
  avgPointDiff: number;
  avgTotalPts: number;
  gamesCount: number;
}

export interface PointDiffTrendsResult {
  teamTrends: TeamPointDiffTrend[];
  bestPointDiff: BestPointDiffTeamSeason[];
  worstPointDiff: BestPointDiffTeamSeason[];
  pythagoreanWins: PythagoreanWins[];
  leagueTrends: LeagueTrend[];
}

function calculatePythagoreanWins(pointsFor: number, pointsAgainst: number, gamesPlayed: number): number {
  const exponent = 2.37;
  const pf = Math.pow(pointsFor, exponent);
  const pa = Math.pow(pointsAgainst, exponent);
  if (pf + pa === 0) return 0;
  return (pf / (pf + pa)) * gamesPlayed;
}

export function computePointDiffTrends(games: PointDiffGame[]): PointDiffTrendsResult {
  if (games.length === 0) {
    return {
      teamTrends: [],
      bestPointDiff: [],
      worstPointDiff: [],
      pythagoreanWins: [],
      leagueTrends: [],
    };
  }

  // Group games by team and season
  const teamSeasonGames = new Map<string, Map<number, PointDiffGame[]>>();

  for (const game of games) {
    // Home team
    if (!teamSeasonGames.has(game.homeTeamName)) {
      teamSeasonGames.set(game.homeTeamName, new Map());
    }
    const homeMap = teamSeasonGames.get(game.homeTeamName)!;
    if (!homeMap.has(game.season)) {
      homeMap.set(game.season, []);
    }
    homeMap.get(game.season)!.push(game);

    // Away team
    if (!teamSeasonGames.has(game.awayTeamName)) {
      teamSeasonGames.set(game.awayTeamName, new Map());
    }
    const awayMap = teamSeasonGames.get(game.awayTeamName)!;
    if (!awayMap.has(game.season)) {
      awayMap.set(game.season, []);
    }
    awayMap.get(game.season)!.push(game);
  }

  // Build trends
  const teamTrends: TeamPointDiffTrend[] = [];
  const bestPointDiffList: BestPointDiffTeamSeason[] = [];
  const pythagoreanWinsList: PythagoreanWins[] = [];

  for (const [team, seasonMap] of teamSeasonGames.entries()) {
    for (const [season, seasonGames] of seasonMap.entries()) {
      // Sort by week
      const sortedGames = [...seasonGames].sort((a, b) => a.week - b.week);

      // Calculate point diffs
      let cumulative = 0;
      const pointDiffEntries: PointDiffEntry[] = [];
      let totalPointDiff = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;

      for (const game of sortedGames) {
        const isHome = game.homeTeamName === team;
        const pointDiff = isHome ? game.homeScore - game.awayScore : game.awayScore - game.homeScore;
        cumulative += pointDiff;
        totalPointDiff += pointDiff;

        pointDiffEntries.push({
          week: game.week,
          pointDiff,
          cumulative,
        });

        if (isHome) {
          pointsFor += game.homeScore;
          pointsAgainst += game.awayScore;
        } else {
          pointsFor += game.awayScore;
          pointsAgainst += game.homeScore;
        }
      }

      teamTrends.push({
        team,
        season,
        cumulativePointDiff: pointDiffEntries,
      });

      // Best/worst point diff
      bestPointDiffList.push({
        team,
        season,
        totalPointDiff,
        gamesPlayed: sortedGames.length,
        avgPointDiffPerGame: sortedGames.length > 0 ? totalPointDiff / sortedGames.length : 0,
      });

      // Pythagorean wins
      const wins = sortedGames.filter((g) => {
        const isHome = g.homeTeamName === team;
        return isHome ? g.homeScore > g.awayScore : g.awayScore > g.homeScore;
      }).length;

      const expectedWins = calculatePythagoreanWins(pointsFor, pointsAgainst, sortedGames.length);

      pythagoreanWinsList.push({
        team,
        season,
        actualWins: wins,
        expectedWins: Math.round(expectedWins * 100) / 100,
        diff: Math.round((wins - expectedWins) * 100) / 100,
        pointsFor,
        pointsAgainst,
        gamesPlayed: sortedGames.length,
      });
    }
  }

  // Sort for best/worst
  const sortedPointDiff = bestPointDiffList.sort((a, b) => b.totalPointDiff - a.totalPointDiff);
  const best = sortedPointDiff.slice(0, 10);
  const worst = sortedPointDiff.slice(-10).reverse();

  // League trends
  const leagueMap = new Map<number, { totalDiff: number; totalPts: number; gameCount: number }>();
  for (const game of games) {
    if (!leagueMap.has(game.season)) {
      leagueMap.set(game.season, { totalDiff: 0, totalPts: 0, gameCount: 0 });
    }
    const season = leagueMap.get(game.season)!;
    season.totalDiff += Math.abs(game.homeScore - game.awayScore);
    season.totalPts += game.homeScore + game.awayScore;
    season.gameCount++;
  }

  const leagueTrends: LeagueTrend[] = Array.from(leagueMap.entries())
    .map(([season, data]) => ({
      season,
      avgPointDiff: Math.round((data.totalDiff / data.gameCount) * 100) / 100,
      avgTotalPts: Math.round((data.totalPts / data.gameCount) * 100) / 100,
      gamesCount: data.gameCount,
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamTrends,
    bestPointDiff: best,
    worstPointDiff: worst,
    pythagoreanWins: pythagoreanWinsList.sort((a, b) => b.actualWins - a.actualWins),
    leagueTrends,
  };
}
