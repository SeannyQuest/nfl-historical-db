/**
 * Pure championship predictor computation — no DB dependency.
 * Analyzes regular season stats that correlate with playoff success.
 */

export interface PredictorGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeConference: string;
  isPlayoff: boolean;
}

export interface PlayoffTeamProfile {
  team: string;
  season: number;
  regSeasonWins: number;
  regSeasonLosses: number;
  avgMargin: number;
  madePlayoffs: boolean;
}

export interface WinThreshold {
  minWins: number;
  playoffPct: number;
}

export interface BestPredictor {
  metric: string;
  correlation: number;
}

export interface ChampionshipPredictorResult {
  playoffTeamProfiles: PlayoffTeamProfile[];
  winThresholds: WinThreshold[];
  avgMarginCorrelation: number;
  bestPredictors: BestPredictor[];
}

export function computeChampionshipPredictor(
  games: PredictorGame[]
): ChampionshipPredictorResult {
  if (games.length === 0) {
    return {
      playoffTeamProfiles: [],
      winThresholds: [],
      avgMarginCorrelation: 0,
      bestPredictors: [],
    };
  }

  // Separate regular season and playoff games
  const regSeasonGames = games.filter((g) => !g.isPlayoff);
  const playoffGames = games.filter((g) => g.isPlayoff);

  // Get all teams that made playoffs (appeared in playoff games)
  const playoffTeams = new Set<string>();
  for (const g of playoffGames) {
    playoffTeams.add(g.homeTeamName);
    playoffTeams.add(g.awayTeamName);
  }

  // Compute regular season stats for all teams
  interface TeamSeasonStats {
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    gamesPlayed: number;
  }

  const teamSeasonMap = new Map<
    string,
    Map<number, TeamSeasonStats>
  >();

  for (const g of regSeasonGames) {
    const homeWon = g.homeScore > g.awayScore;

    [
      {
        team: g.homeTeamName,
        won: homeWon,
        pf: g.homeScore,
        pa: g.awayScore,
      },
      {
        team: g.awayTeamName,
        won: !homeWon,
        pf: g.awayScore,
        pa: g.homeScore,
      },
    ].forEach(({ team, won, pf, pa }) => {
      if (!teamSeasonMap.has(team)) {
        teamSeasonMap.set(team, new Map());
      }
      const seasons = teamSeasonMap.get(team)!;
      if (!seasons.has(g.season)) {
        seasons.set(g.season, {
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
          gamesPlayed: 0,
        });
      }
      const stats = seasons.get(g.season)!;
      if (won) stats.wins++;
      else stats.losses++;
      stats.pointsFor += pf;
      stats.pointsAgainst += pa;
      stats.gamesPlayed++;
    });
  }

  // Build playoff profiles
  const playoffTeamProfiles: PlayoffTeamProfile[] = [];

  for (const [team, seasons] of teamSeasonMap.entries()) {
    for (const [season, stats] of seasons.entries()) {
      if (stats.gamesPlayed === 0) continue;

      const madePlayoffs = playoffTeams.has(team);
      const avgMargin =
        stats.gamesPlayed > 0
          ? (stats.pointsFor - stats.pointsAgainst) / stats.gamesPlayed
          : 0;

      playoffTeamProfiles.push({
        team,
        season,
        regSeasonWins: stats.wins,
        regSeasonLosses: stats.losses,
        avgMargin: Math.round(avgMargin * 100) / 100,
        madePlayoffs,
      });
    }
  }

  // Win thresholds: what win total correlates with playoff appearance?
  const winBuckets = new Map<
    number,
    { playoffCount: number; totalCount: number }
  >();

  for (const profile of playoffTeamProfiles) {
    const winBucket = profile.regSeasonWins;
    if (!winBuckets.has(winBucket)) {
      winBuckets.set(winBucket, { playoffCount: 0, totalCount: 0 });
    }
    const bucket = winBuckets.get(winBucket)!;
    bucket.totalCount++;
    if (profile.madePlayoffs) {
      bucket.playoffCount++;
    }
  }

  const winThresholds: WinThreshold[] = Array.from(winBuckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([minWins, data]) => ({
      minWins,
      playoffPct:
        data.totalCount > 0
          ? Math.round((data.playoffCount / data.totalCount) * 10000) / 10000
          : 0,
    }));

  // Avg margin correlation (teams with higher avg margin more likely to make playoffs)
  const playoffMargins: number[] = [];
  const missedMargins: number[] = [];

  for (const profile of playoffTeamProfiles) {
    if (profile.madePlayoffs) {
      playoffMargins.push(profile.avgMargin);
    } else {
      missedMargins.push(profile.avgMargin);
    }
  }

  let avgMarginCorrelation = 0;
  if (playoffMargins.length > 0 && missedMargins.length > 0) {
    const playoffAvg =
      playoffMargins.reduce((a, b) => a + b, 0) / playoffMargins.length;
    const missedAvg =
      missedMargins.reduce((a, b) => a + b, 0) / missedMargins.length;
    avgMarginCorrelation = Math.round((playoffAvg - missedAvg) * 100) / 100;
  }

  // Best predictors: correlation strength of different metrics
  // Wins: separation between playoff and non-playoff teams
  const playoffWins: number[] = [];
  const missedWins: number[] = [];

  for (const profile of playoffTeamProfiles) {
    if (profile.madePlayoffs) {
      playoffWins.push(profile.regSeasonWins);
    } else {
      missedWins.push(profile.regSeasonWins);
    }
  }

  let winsCorrelation = 0;
  if (playoffWins.length > 0 && missedWins.length > 0) {
    const playoffAvg =
      playoffWins.reduce((a, b) => a + b, 0) / playoffWins.length;
    const missedAvg =
      missedWins.reduce((a, b) => a + b, 0) / missedWins.length;
    winsCorrelation = Math.round((playoffAvg - missedAvg) * 100) / 100;
  }

  const bestPredictors: BestPredictor[] = [
    { metric: "Wins", correlation: winsCorrelation },
    { metric: "Avg Point Margin", correlation: avgMarginCorrelation },
  ]
    .filter((x) => x.correlation !== 0)
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return {
    playoffTeamProfiles,
    winThresholds,
    avgMarginCorrelation: Math.round(avgMarginCorrelation * 100) / 100,
    bestPredictors,
  };
}
