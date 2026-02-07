/**
 * Pure historical comparison computation — no DB dependency.
 * Compares two teams across their history.
 */

export interface ComparisonGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface HeadToHead {
  team1Wins: number;
  team2Wins: number;
  ties: number;
  totalGames: number;
}

export interface HomeFieldAdvantage {
  team1HomeWins: number;
  team1AwayWins: number;
  team2HomeWins: number;
  team2AwayWins: number;
}

export interface ScoringComparison {
  team1AvgPts: string;
  team2AvgPts: string;
  avgMargin: string;
}

export interface RecentMeeting {
  season: number;
  winner: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface SeasonRecord {
  season: number;
  team1Wins: number;
  team2Wins: number;
}

export interface HistoricalComparisonResult {
  headToHead: HeadToHead;
  homeFieldAdvantage: HomeFieldAdvantage;
  scoringComparison: ScoringComparison;
  recentForm: RecentMeeting[];
  seasonBySeasonRecord: SeasonRecord[];
}

export function computeHistoricalComparison(
  games: ComparisonGame[],
  team1: string,
  team2: string
): HistoricalComparisonResult {
  // Filter games between the two teams
  const headToHeadGames = games.filter(
    (g) =>
      (g.homeTeamName === team1 && g.awayTeamName === team2) ||
      (g.homeTeamName === team2 && g.awayTeamName === team1)
  );

  if (headToHeadGames.length === 0) {
    return {
      headToHead: { team1Wins: 0, team2Wins: 0, ties: 0, totalGames: 0 },
      homeFieldAdvantage: {
        team1HomeWins: 0,
        team1AwayWins: 0,
        team2HomeWins: 0,
        team2AwayWins: 0,
      },
      scoringComparison: { team1AvgPts: "0.0", team2AvgPts: "0.0", avgMargin: "0.0" },
      recentForm: [],
      seasonBySeasonRecord: [],
    };
  }

  // Track metrics
  let team1Wins = 0;
  let team2Wins = 0;
  let ties = 0;

  let team1HomeWins = 0;
  let team1AwayWins = 0;
  let team2HomeWins = 0;
  let team2AwayWins = 0;

  let team1TotalPoints = 0;
  let team2TotalPoints = 0;
  let totalMarginDiff = 0;

  const seasonRecordMap = new Map<number, { team1: number; team2: number }>();

  for (const game of headToHeadGames) {
    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;
    const margin = Math.abs(game.homeScore - game.awayScore);

    if (homeWon === awayWon && game.homeScore === game.awayScore) {
      ties++;
    } else if (game.homeTeamName === team1) {
      if (homeWon) {
        team1Wins++;
        team1HomeWins++;
      } else {
        team2Wins++;
        team2AwayWins++;
      }
      team1TotalPoints += game.homeScore;
      team2TotalPoints += game.awayScore;
      totalMarginDiff += homeWon ? margin : -margin;
    } else {
      // team1 is away
      if (awayWon) {
        team1Wins++;
        team1AwayWins++;
      } else {
        team2Wins++;
        team2HomeWins++;
      }
      team1TotalPoints += game.awayScore;
      team2TotalPoints += game.homeScore;
      totalMarginDiff += awayWon ? margin : -margin;
    }

    // Track season-by-season
    if (!seasonRecordMap.has(game.season)) {
      seasonRecordMap.set(game.season, { team1: 0, team2: 0 });
    }
    const seasonRecord = seasonRecordMap.get(game.season)!;
    if (game.homeTeamName === team1) {
      if (homeWon) seasonRecord.team1++;
      else seasonRecord.team2++;
    } else {
      if (awayWon) seasonRecord.team1++;
      else seasonRecord.team2++;
    }
  }

  // Compute averages
  const team1AvgPts = (team1TotalPoints / headToHeadGames.length).toFixed(1);
  const team2AvgPts = (team2TotalPoints / headToHeadGames.length).toFixed(1);
  const avgMargin = (Math.abs(totalMarginDiff) / headToHeadGames.length).toFixed(1);

  // Last 10 games
  const recentGames = [...headToHeadGames]
    .sort((a, b) => b.season - a.season)
    .slice(0, 10);

  const recentForm: RecentMeeting[] = recentGames.map((g) => {
    const team1IsHome = g.homeTeamName === team1;
    const team1Won = team1IsHome
      ? g.homeScore > g.awayScore
      : g.awayScore > g.homeScore;
    const winner = team1Won ? team1 : team2;

    return {
      season: g.season,
      winner,
      homeTeam: g.homeTeamName,
      awayTeam: g.awayTeamName,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
    };
  });

  // Season by season
  const seasonBySeasonRecord: SeasonRecord[] = Array.from(
    seasonRecordMap.entries()
  )
    .sort((a, b) => b[0] - a[0])
    .map(([season, record]) => ({
      season,
      team1Wins: record.team1,
      team2Wins: record.team2,
    }));

  return {
    headToHead: {
      team1Wins,
      team2Wins,
      ties,
      totalGames: headToHeadGames.length,
    },
    homeFieldAdvantage: {
      team1HomeWins,
      team1AwayWins,
      team2HomeWins,
      team2AwayWins,
    },
    scoringComparison: {
      team1AvgPts,
      team2AvgPts,
      avgMargin,
    },
    recentForm,
    seasonBySeasonRecord,
  };
}
