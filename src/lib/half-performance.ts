/**
 * Pure half-season performance computation — no DB dependency.
 * Analyzes first half vs second half performance and identifies improvers/decliners.
 */

export interface HalfGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamHalfRecord {
  team: string;
  season: number;
  firstHalfWins: number;
  firstHalfLosses: number;
  secondHalfWins: number;
  secondHalfLosses: number;
  firstHalfWinPct: number;
  secondHalfWinPct: number;
  improvement: number;
}

export interface BiggestHalfImprover {
  team: string;
  season: number;
  firstHalfWinPct: number;
  secondHalfWinPct: number;
  improvement: number;
  firstHalfRecord: string;
  secondHalfRecord: string;
}

export interface SeasonHalfTrend {
  season: number;
  avgFirstHalfWinPct: number;
  avgSecondHalfWinPct: number;
  leagueImprovement: number;
}

export interface HalfPerformanceResult {
  teamHalfRecords: TeamHalfRecord[];
  biggestImprovers: BiggestHalfImprover[];
  biggestDecliners: BiggestHalfImprover[];
  seasonTrends: SeasonHalfTrend[];
}

function calculateWinPct(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 10000) / 10000;
}

export function computeHalfPerformance(games: HalfGame[]): HalfPerformanceResult {
  if (games.length === 0) {
    return {
      teamHalfRecords: [],
      biggestImprovers: [],
      biggestDecliners: [],
      seasonTrends: [],
    };
  }

  // Group games by team and season
  const teamSeasonGames = new Map<string, Map<number, HalfGame[]>>();

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

  const teamHalfRecords: TeamHalfRecord[] = [];

  for (const [team, seasonMap] of teamSeasonGames.entries()) {
    for (const [season, seasonGames] of seasonMap.entries()) {
      // Split into first half (weeks 1-9) and second half (weeks 10+)
      const firstHalf = seasonGames.filter((g) => g.week <= 9);
      const secondHalf = seasonGames.filter((g) => g.week >= 10);

      // Count wins and losses
      let firstHalfWins = 0,
        firstHalfLosses = 0;
      let secondHalfWins = 0,
        secondHalfLosses = 0;

      for (const game of firstHalf) {
        const isHome = game.homeTeamName === team;
        const teamWon = isHome ? game.homeScore > game.awayScore : game.awayScore > game.homeScore;
        if (teamWon) {
          firstHalfWins++;
        } else if ((isHome && game.awayScore > game.homeScore) || (!isHome && game.homeScore > game.awayScore)) {
          firstHalfLosses++;
        }
      }

      for (const game of secondHalf) {
        const isHome = game.homeTeamName === team;
        const teamWon = isHome ? game.homeScore > game.awayScore : game.awayScore > game.homeScore;
        if (teamWon) {
          secondHalfWins++;
        } else if ((isHome && game.awayScore > game.homeScore) || (!isHome && game.homeScore > game.awayScore)) {
          secondHalfLosses++;
        }
      }

      const firstHalfWinPct = calculateWinPct(firstHalfWins, firstHalfLosses);
      const secondHalfWinPct = calculateWinPct(secondHalfWins, secondHalfLosses);
      const improvement = secondHalfWinPct - firstHalfWinPct;

      teamHalfRecords.push({
        team,
        season,
        firstHalfWins,
        firstHalfLosses,
        secondHalfWins,
        secondHalfLosses,
        firstHalfWinPct,
        secondHalfWinPct,
        improvement,
      });
    }
  }

  // Identify improvers and decliners
  const improverList: BiggestHalfImprover[] = teamHalfRecords
    .filter((t) => t.improvement > 0)
    .map((t) => ({
      team: t.team,
      season: t.season,
      firstHalfWinPct: t.firstHalfWinPct,
      secondHalfWinPct: t.secondHalfWinPct,
      improvement: t.improvement,
      firstHalfRecord: `${t.firstHalfWins}-${t.firstHalfLosses}`,
      secondHalfRecord: `${t.secondHalfWins}-${t.secondHalfLosses}`,
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10);

  const declinerList: BiggestHalfImprover[] = teamHalfRecords
    .filter((t) => t.improvement < 0)
    .map((t) => ({
      team: t.team,
      season: t.season,
      firstHalfWinPct: t.firstHalfWinPct,
      secondHalfWinPct: t.secondHalfWinPct,
      improvement: t.improvement,
      firstHalfRecord: `${t.firstHalfWins}-${t.firstHalfLosses}`,
      secondHalfRecord: `${t.secondHalfWins}-${t.secondHalfLosses}`,
    }))
    .sort((a, b) => a.improvement - b.improvement)
    .slice(0, 10);

  // Calculate season trends
  const seasonTrendsMap = new Map<
    number,
    {
      firstHalfPcts: number[];
      secondHalfPcts: number[];
    }
  >();

  for (const record of teamHalfRecords) {
    if (!seasonTrendsMap.has(record.season)) {
      seasonTrendsMap.set(record.season, {
        firstHalfPcts: [],
        secondHalfPcts: [],
      });
    }
    const seasonData = seasonTrendsMap.get(record.season)!;
    seasonData.firstHalfPcts.push(record.firstHalfWinPct);
    seasonData.secondHalfPcts.push(record.secondHalfWinPct);
  }

  const seasonTrends: SeasonHalfTrend[] = Array.from(seasonTrendsMap.entries())
    .map(([season, data]) => {
      const avgFirstHalf =
        data.firstHalfPcts.length > 0
          ? Math.round((data.firstHalfPcts.reduce((a, b) => a + b, 0) / data.firstHalfPcts.length) * 10000) / 10000
          : 0;
      const avgSecondHalf =
        data.secondHalfPcts.length > 0
          ? Math.round((data.secondHalfPcts.reduce((a, b) => a + b, 0) / data.secondHalfPcts.length) * 10000) / 10000
          : 0;
      return {
        season,
        avgFirstHalfWinPct: avgFirstHalf,
        avgSecondHalfWinPct: avgSecondHalf,
        leagueImprovement: avgSecondHalf - avgFirstHalf,
      };
    })
    .sort((a, b) => a.season - b.season);

  return {
    teamHalfRecords,
    biggestImprovers: improverList,
    biggestDecliners: declinerList,
    seasonTrends,
  };
}
