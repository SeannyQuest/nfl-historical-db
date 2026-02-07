/**
 * Pure tanking index computation — no DB dependency.
 * Identifies potential tank behavior by analyzing second-half performance.
 */

export interface TankingGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamTankingRecord {
  team: string;
  season: number;
  firstHalfWins: number;
  firstHalfLosses: number;
  secondHalfWins: number;
  secondHalfLosses: number;
  tankingScore: number;
}

export interface SuspectedTanker {
  team: string;
  season: number;
  tankingScore: number;
  firstHalfRecord: string;
  secondHalfRecord: string;
}

export interface SeasonTankingTrend {
  season: number;
  avgTankingScore: number;
}

export interface TankingIndexResult {
  teamTankingScores: TeamTankingRecord[];
  suspectedTankers: SuspectedTanker[];
  seasonTrends: SeasonTankingTrend[];
}

export function computeTankingIndex(
  games: TankingGame[]
): TankingIndexResult {
  if (games.length === 0) {
    return {
      teamTankingScores: [],
      suspectedTankers: [],
      seasonTrends: [],
    };
  }

  // Map to track team records per season
  interface TeamSeasonData {
    firstHalfWins: number;
    firstHalfLosses: number;
    secondHalfWins: number;
    secondHalfLosses: number;
  }

  const teamSeasonMap = new Map<
    string,
    Map<number, TeamSeasonData>
  >();

  // Track all teams and seasons
  const allTeams = new Set<string>();
  const allSeasons = new Set<number>();

  for (const g of games) {
    allTeams.add(g.homeTeamName);
    allTeams.add(g.awayTeamName);
    allSeasons.add(g.season);

    const homeTeam = g.homeTeamName;
    const awayTeam = g.awayTeamName;
    const isFirstHalf = g.week < 10;
    const homeWon = g.homeScore > g.awayScore;

    // Initialize if needed
    if (!teamSeasonMap.has(homeTeam)) {
      teamSeasonMap.set(homeTeam, new Map());
    }
    if (!teamSeasonMap.has(awayTeam)) {
      teamSeasonMap.set(awayTeam, new Map());
    }

    const homeSeasons = teamSeasonMap.get(homeTeam)!;
    const awaySeasons = teamSeasonMap.get(awayTeam)!;

    if (!homeSeasons.has(g.season)) {
      homeSeasons.set(g.season, {
        firstHalfWins: 0,
        firstHalfLosses: 0,
        secondHalfWins: 0,
        secondHalfLosses: 0,
      });
    }
    if (!awaySeasons.has(g.season)) {
      awaySeasons.set(g.season, {
        firstHalfWins: 0,
        firstHalfLosses: 0,
        secondHalfWins: 0,
        secondHalfLosses: 0,
      });
    }

    const homeData = homeSeasons.get(g.season)!;
    const awayData = awaySeasons.get(g.season)!;

    if (isFirstHalf) {
      if (homeWon) {
        homeData.firstHalfWins++;
        awayData.firstHalfLosses++;
      } else {
        homeData.firstHalfLosses++;
        awayData.firstHalfWins++;
      }
    } else {
      if (homeWon) {
        homeData.secondHalfWins++;
        awayData.secondHalfLosses++;
      } else {
        homeData.secondHalfLosses++;
        awayData.secondHalfWins++;
      }
    }
  }

  // Compute tanking scores
  const teamTankingScores: TeamTankingRecord[] = [];
  const seasonScores = new Map<number, number[]>();

  for (const [team, seasons] of teamSeasonMap.entries()) {
    for (const [season, data] of seasons.entries()) {
      const firstHalfTotal =
        data.firstHalfWins + data.firstHalfLosses;
      const secondHalfTotal =
        data.secondHalfWins + data.secondHalfLosses;

      let tankingScore = 0;
      if (firstHalfTotal > 0 && secondHalfTotal > 0) {
        const firstHalfLossRate = data.firstHalfLosses / firstHalfTotal;
        const secondHalfLossRate = data.secondHalfLosses / secondHalfTotal;
        tankingScore = secondHalfLossRate - firstHalfLossRate;
      }

      teamTankingScores.push({
        team,
        season,
        firstHalfWins: data.firstHalfWins,
        firstHalfLosses: data.firstHalfLosses,
        secondHalfWins: data.secondHalfWins,
        secondHalfLosses: data.secondHalfLosses,
        tankingScore: Math.round(tankingScore * 10000) / 10000,
      });

      if (!seasonScores.has(season)) {
        seasonScores.set(season, []);
      }
      seasonScores.get(season)!.push(tankingScore);
    }
  }

  // Top 10 suspected tankers
  const suspectedTankers: SuspectedTanker[] = teamTankingScores
    .filter((x) => x.tankingScore > 0)
    .sort((a, b) => b.tankingScore - a.tankingScore)
    .slice(0, 10)
    .map((x) => ({
      team: x.team,
      season: x.season,
      tankingScore: x.tankingScore,
      firstHalfRecord: `${x.firstHalfWins}-${x.firstHalfLosses}`,
      secondHalfRecord: `${x.secondHalfWins}-${x.secondHalfLosses}`,
    }));

  // Season trends
  const seasonTrends: SeasonTankingTrend[] = Array.from(seasonScores.entries())
    .sort(([a], [b]) => b - a)
    .map(([season, scores]) => ({
      season,
      avgTankingScore:
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10000
            ) / 10000
          : 0,
    }));

  return {
    teamTankingScores,
    suspectedTankers,
    seasonTrends,
  };
}
