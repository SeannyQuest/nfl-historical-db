/**
 * Pure over/under performers computation — no DB dependency.
 * Uses Pythagorean expectation to identify teams over/underperforming expected wins.
 */

export interface PerformanceGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamPerformance {
  team: string;
  season: number;
  actualWins: number;
  expectedWins: number;
  overUnder: number;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface OverUnderPerformer {
  team: string;
  season: number;
  actualWins: number;
  expectedWins: number;
  overUnder: number;
  gamesPlayed: number;
}

export interface LuckyTeamTrend {
  team: string;
  seasons: number[];
  overUnderValues: number[];
  avgOverUnder: number;
  consistentlyOver: boolean;
}

export interface OverUnderPerformersResult {
  teamPerformance: TeamPerformance[];
  biggestOverperformers: OverUnderPerformer[];
  biggestUnderperformers: OverUnderPerformer[];
  luckyTeams: LuckyTeamTrend[];
}

function calculatePythagoreanWins(pointsFor: number, pointsAgainst: number, gamesPlayed: number): number {
  const exponent = 2.37;
  const pf = Math.pow(pointsFor, exponent);
  const pa = Math.pow(pointsAgainst, exponent);
  if (pf + pa === 0) return 0;
  return (pf / (pf + pa)) * gamesPlayed;
}

export function computeOverUnderPerformers(games: PerformanceGame[]): OverUnderPerformersResult {
  if (games.length === 0) {
    return {
      teamPerformance: [],
      biggestOverperformers: [],
      biggestUnderperformers: [],
      luckyTeams: [],
    };
  }

  // Group games by team and season
  const teamSeasonGames = new Map<string, Map<number, PerformanceGame[]>>();

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

  // Calculate performance
  const teamPerformance: TeamPerformance[] = [];

  for (const [team, seasonMap] of teamSeasonGames.entries()) {
    for (const [season, seasonGames] of seasonMap.entries()) {
      let pointsFor = 0;
      let pointsAgainst = 0;
      let actualWins = 0;

      for (const game of seasonGames) {
        const isHome = game.homeTeamName === team;

        if (isHome) {
          pointsFor += game.homeScore;
          pointsAgainst += game.awayScore;
          if (game.homeScore > game.awayScore) {
            actualWins++;
          }
        } else {
          pointsFor += game.awayScore;
          pointsAgainst += game.homeScore;
          if (game.awayScore > game.homeScore) {
            actualWins++;
          }
        }
      }

      const expectedWins = calculatePythagoreanWins(pointsFor, pointsAgainst, seasonGames.length);
      const overUnder = Math.round((actualWins - expectedWins) * 100) / 100;

      teamPerformance.push({
        team,
        season,
        actualWins,
        expectedWins: Math.round(expectedWins * 100) / 100,
        overUnder,
        gamesPlayed: seasonGames.length,
        pointsFor,
        pointsAgainst,
      });
    }
  }

  // Sort for over/underperformers
  const sortedPerformance = [...teamPerformance].sort((a, b) => b.overUnder - a.overUnder);
  const biggestOverperformers = sortedPerformance.slice(0, 10).map((p) => ({
    team: p.team,
    season: p.season,
    actualWins: p.actualWins,
    expectedWins: p.expectedWins,
    overUnder: p.overUnder,
    gamesPlayed: p.gamesPlayed,
  }));

  const biggestUnderperformers = sortedPerformance.slice(-10).reverse().map((p) => ({
    team: p.team,
    season: p.season,
    actualWins: p.actualWins,
    expectedWins: p.expectedWins,
    overUnder: p.overUnder,
    gamesPlayed: p.gamesPlayed,
  }));

  // Find lucky teams (consistently over-performing)
  const teamOverUnderMap = new Map<string, { seasons: number[]; values: number[] }>();

  for (const perf of teamPerformance) {
    if (!teamOverUnderMap.has(perf.team)) {
      teamOverUnderMap.set(perf.team, { seasons: [], values: [] });
    }
    const data = teamOverUnderMap.get(perf.team)!;
    data.seasons.push(perf.season);
    data.values.push(perf.overUnder);
  }

  const luckyTeams: LuckyTeamTrend[] = Array.from(teamOverUnderMap.entries())
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_team, data]) => data.seasons.length >= 2)
    .map(([team, data]) => {
      const avgOverUnder = Math.round((data.values.reduce((a, b) => a + b, 0) / data.values.length) * 100) / 100;
      const consistentlyOver = data.values.filter((v) => v > 0).length >= Math.ceil(data.values.length / 2);

      return {
        team,
        seasons: data.seasons,
        overUnderValues: data.values,
        avgOverUnder,
        consistentlyOver,
      };
    })
    .filter((t) => t.consistentlyOver)
    .sort((a, b) => b.avgOverUnder - a.avgOverUnder);

  return {
    teamPerformance,
    biggestOverperformers,
    biggestUnderperformers,
    luckyTeams,
  };
}
