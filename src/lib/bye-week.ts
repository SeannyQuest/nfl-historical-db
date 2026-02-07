/**
 * Pure bye week impact computation — no DB dependency.
 * Operates on arrays of game-like objects to compute bye week analytics.
 */

export interface ByeWeekGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeOnBye: boolean;
  awayOnBye: boolean;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface ByeWeekStats {
  totalGames: number;
  recordOnBye: {
    wins: number;
    losses: number;
    ties: number;
    winPct: string;
  };
  recordNotOnBye: {
    wins: number;
    losses: number;
    ties: number;
    winPct: string;
  };
  coverRateOnBye: string;
  coverRateNotOnBye: string;
  scoringDifferentialOnBye: string;
  scoringDifferentialNotOnBye: string;
  byeWeekTrends: Array<{
    season: number;
    gamesOnBye: number;
    byeWinPct: string;
    gamesNotOnBye: number;
    notByeWinPct: string;
  }>;
  opponentOnByeStats: {
    wins: number;
    losses: number;
    ties: number;
    winPct: string;
  };
}

export interface ByeWeekImpactResult {
  stats: ByeWeekStats;
}

export function computeByeWeekImpact(games: ByeWeekGame[]): ByeWeekImpactResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        recordOnBye: { wins: 0, losses: 0, ties: 0, winPct: ".000" },
        recordNotOnBye: { wins: 0, losses: 0, ties: 0, winPct: ".000" },
        coverRateOnBye: ".000",
        coverRateNotOnBye: ".000",
        scoringDifferentialOnBye: "0.0",
        scoringDifferentialNotOnBye: "0.0",
        byeWeekTrends: [],
        opponentOnByeStats: { wins: 0, losses: 0, ties: 0, winPct: ".000" },
      },
    };
  }

  // On-bye stats
  let byeWins = 0,
    byeLosses = 0,
    byeTies = 0;
  let byeCovered = 0,
    byeCoverTotal = 0;
  let byePointsFor = 0,
    byePointsAgainst = 0;

  // Not on-bye stats
  let notByeWins = 0,
    notByeLosses = 0,
    notByeTies = 0;
  let notByeCovered = 0,
    notByeCoverTotal = 0;
  let notByePointsFor = 0,
    notByePointsAgainst = 0;

  // Opponent on bye
  let oppByeWins = 0,
    oppByeLosses = 0,
    oppByeTies = 0;

  // Season trends
  const seasonMap = new Map<
    number,
    {
      byeGames: number;
      byeWins: number;
      byeDecisions: number;
      notByeGames: number;
      notByeWins: number;
      notByeDecisions: number;
    }
  >();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    // Initialize season if needed
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, {
        byeGames: 0,
        byeWins: 0,
        byeDecisions: 0,
        notByeGames: 0,
        notByeWins: 0,
        notByeDecisions: 0,
      });
    }
    const season = seasonMap.get(g.season)!;

    // Home team stats
    if (g.homeOnBye) {
      if (homeWon) byeWins++;
      else if (awayWon) byeLosses++;
      else byeTies++;

      byePointsFor += g.homeScore;
      byePointsAgainst += g.awayScore;

      if (g.spreadResult === "COVERED") byeCovered++;
      if (g.spreadResult) byeCoverTotal++;

      season.byeGames++;
      if (homeWon || awayWon) {
        season.byeDecisions++;
        if (homeWon) season.byeWins++;
      }
    } else {
      if (homeWon) notByeWins++;
      else if (awayWon) notByeLosses++;
      else notByeTies++;

      notByePointsFor += g.homeScore;
      notByePointsAgainst += g.awayScore;

      if (g.spreadResult === "COVERED") notByeCovered++;
      if (g.spreadResult) notByeCoverTotal++;

      season.notByeGames++;
      if (homeWon || awayWon) {
        season.notByeDecisions++;
        if (homeWon) season.notByeWins++;
      }
    }

    // Away team stats
    if (g.awayOnBye) {
      if (awayWon) byeWins++;
      else if (homeWon) byeLosses++;
      else byeTies++;

      byePointsFor += g.awayScore;
      byePointsAgainst += g.homeScore;

      if (g.spreadResult === "COVERED") byeCovered++;
      if (g.spreadResult) byeCoverTotal++;

      season.byeGames++;
      if (homeWon || awayWon) {
        season.byeDecisions++;
        if (awayWon) season.byeWins++;
      }
    } else {
      if (awayWon) notByeWins++;
      else if (homeWon) notByeLosses++;
      else notByeTies++;

      notByePointsFor += g.awayScore;
      notByePointsAgainst += g.homeScore;

      if (g.spreadResult === "COVERED") notByeCovered++;
      if (g.spreadResult) notByeCoverTotal++;

      season.notByeGames++;
      if (homeWon || awayWon) {
        season.notByeDecisions++;
        if (awayWon) season.notByeWins++;
      }
    }

    // Opponent on bye (team wins when playing against bye team)
    if (g.homeOnBye && awayWon) oppByeWins++;
    else if (g.homeOnBye && homeWon) oppByeLosses++;
    else if (g.homeOnBye) oppByeTies++;

    if (g.awayOnBye && homeWon) oppByeWins++;
    else if (g.awayOnBye && awayWon) oppByeLosses++;
    else if (g.awayOnBye) oppByeTies++;
  }

  // Build season trends
  const byeWeekTrends = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      gamesOnBye: data.byeGames,
      byeWinPct: data.byeDecisions > 0 ? (data.byeWins / data.byeDecisions).toFixed(3) : ".000",
      gamesNotOnBye: data.notByeGames,
      notByeWinPct: data.notByeDecisions > 0 ? (data.notByeWins / data.notByeDecisions).toFixed(3) : ".000",
    }));

  const byeDecisions = byeWins + byeLosses;
  const notByeDecisions = notByeWins + notByeLosses;
  const oppByeDecisions = oppByeWins + oppByeLosses;

  return {
    stats: {
      totalGames: games.length,
      recordOnBye: {
        wins: byeWins,
        losses: byeLosses,
        ties: byeTies,
        winPct: byeDecisions > 0 ? (byeWins / byeDecisions).toFixed(3) : ".000",
      },
      recordNotOnBye: {
        wins: notByeWins,
        losses: notByeLosses,
        ties: notByeTies,
        winPct: notByeDecisions > 0 ? (notByeWins / notByeDecisions).toFixed(3) : ".000",
      },
      coverRateOnBye: byeCoverTotal > 0 ? (byeCovered / byeCoverTotal).toFixed(3) : ".000",
      coverRateNotOnBye: notByeCoverTotal > 0 ? (notByeCovered / notByeCoverTotal).toFixed(3) : ".000",
      scoringDifferentialOnBye:
        byeWins + byeLosses + byeTies > 0
          ? ((byePointsFor - byePointsAgainst) / (byeWins + byeLosses + byeTies)).toFixed(1)
          : "0.0",
      scoringDifferentialNotOnBye:
        notByeWins + notByeLosses + notByeTies > 0
          ? ((notByePointsFor - notByePointsAgainst) / (notByeWins + notByeLosses + notByeTies)).toFixed(1)
          : "0.0",
      byeWeekTrends,
      opponentOnByeStats: {
        wins: oppByeWins,
        losses: oppByeLosses,
        ties: oppByeTies,
        winPct: oppByeDecisions > 0 ? (oppByeWins / oppByeDecisions).toFixed(3) : ".000",
      },
    },
  };
}
