/**
 * Pure turnover analysis — no DB dependency.
 */

export interface TurnoverGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTurnovers: number;
  awayTurnovers: number;
  homeInterceptions: number;
  awayInterceptions: number;
  homeFumbles: number;
  awayFumbles: number;
}

export interface TeamTurnoverStat {
  team: string;
  gamesPlayed: number;
  totalTurnovers: number;
  turnoversPerGame: number;
  interceptions: number;
  fumbles: number;
  turnoverDifferential: number;
  winPctWhenWinningTurnoverBattle: number;
  winPctWhenLosingTurnoverBattle: number;
}

export interface TurnoverSeasonTrend {
  season: number;
  avgTurnoversPerGame: number;
}

export interface TurnoverResult {
  teamStats: TeamTurnoverStat[];
  leagueAvgTurnoversPerGame: number;
  bestTurnoverDiff: TeamTurnoverStat[];
  worstTurnoverDiff: TeamTurnoverStat[];
  seasonTrends: TurnoverSeasonTrend[];
}

export function computeTurnoverAnalysis(games: TurnoverGame[]): TurnoverResult {
  if (games.length === 0) {
    return {
      teamStats: [],
      leagueAvgTurnoversPerGame: 0,
      bestTurnoverDiff: [],
      worstTurnoverDiff: [],
      seasonTrends: [],
    };
  }

  const teamMap = new Map<
    string,
    {
      gamesPlayed: number;
      totalTurnovers: number;
      interceptions: number;
      fumbles: number;
      winsWinningBattle: number;
      gamesWinningBattle: number;
      winsLosingBattle: number;
      gamesLosingBattle: number;
    }
  >();

  for (const g of games) {
    const homeEntry = teamMap.get(g.homeTeamName) || {
      gamesPlayed: 0,
      totalTurnovers: 0,
      interceptions: 0,
      fumbles: 0,
      winsWinningBattle: 0,
      gamesWinningBattle: 0,
      winsLosingBattle: 0,
      gamesLosingBattle: 0,
    };
    const awayEntry = teamMap.get(g.awayTeamName) || {
      gamesPlayed: 0,
      totalTurnovers: 0,
      interceptions: 0,
      fumbles: 0,
      winsWinningBattle: 0,
      gamesWinningBattle: 0,
      winsLosingBattle: 0,
      gamesLosingBattle: 0,
    };

    homeEntry.gamesPlayed++;
    awayEntry.gamesPlayed++;

    homeEntry.totalTurnovers += g.homeTurnovers;
    awayEntry.totalTurnovers += g.awayTurnovers;

    homeEntry.interceptions += g.homeInterceptions;
    awayEntry.interceptions += g.awayInterceptions;

    homeEntry.fumbles += g.homeFumbles;
    awayEntry.fumbles += g.awayFumbles;

    const homeTODiff = g.awayTurnovers - g.homeTurnovers;
    const awayTODiff = g.homeTurnovers - g.awayTurnovers;

    if (homeTODiff > 0) {
      homeEntry.gamesWinningBattle++;
      if (g.homeScore > g.awayScore) {
        homeEntry.winsWinningBattle++;
      }
      awayEntry.gamesLosingBattle++;
      if (g.awayScore > g.homeScore) {
        awayEntry.winsLosingBattle++;
      }
    } else if (awayTODiff > 0) {
      awayEntry.gamesWinningBattle++;
      if (g.awayScore > g.homeScore) {
        awayEntry.winsWinningBattle++;
      }
      homeEntry.gamesLosingBattle++;
      if (g.homeScore > g.awayScore) {
        homeEntry.winsLosingBattle++;
      }
    }

    teamMap.set(g.homeTeamName, homeEntry);
    teamMap.set(g.awayTeamName, awayEntry);
  }

  const teamStats: TeamTurnoverStat[] = [...teamMap.entries()]
    .map(([team, stats]) => {
      const turnoversPerGame =
        stats.gamesPlayed > 0 ? stats.totalTurnovers / stats.gamesPlayed : 0;
      const winPctWinningBattle =
        stats.gamesWinningBattle > 0
          ? stats.winsWinningBattle / stats.gamesWinningBattle
          : 0;
      const winPctLosingBattle =
        stats.gamesLosingBattle > 0
          ? stats.winsLosingBattle / stats.gamesLosingBattle
          : 0;

      return {
        team,
        gamesPlayed: stats.gamesPlayed,
        totalTurnovers: stats.totalTurnovers,
        turnoversPerGame: parseFloat(turnoversPerGame.toFixed(2)),
        interceptions: stats.interceptions,
        fumbles: stats.fumbles,
        turnoverDifferential: 0, // Will be calculated below
        winPctWhenWinningTurnoverBattle: parseFloat(
          winPctWinningBattle.toFixed(3)
        ),
        winPctWhenLosingTurnoverBattle: parseFloat(
          winPctLosingBattle.toFixed(3)
        ),
      };
    });

  // Calculate turnover differential for each team
  for (const stat of teamStats) {
    const teamGames = games.filter(
      (g) => g.homeTeamName === stat.team || g.awayTeamName === stat.team
    );
    let totalDiff = 0;
    for (const g of teamGames) {
      if (g.homeTeamName === stat.team) {
        totalDiff += g.awayTurnovers - g.homeTurnovers;
      } else {
        totalDiff += g.homeTurnovers - g.awayTurnovers;
      }
    }
    stat.turnoverDifferential = totalDiff;
  }

  const sortedByDiff = [...teamStats].sort(
    (a, b) => b.turnoverDifferential - a.turnoverDifferential
  );
  const bestTurnoverDiff = sortedByDiff.slice(0, 10);
  const worstTurnoverDiff = sortedByDiff.slice(-10).reverse();

  const leagueAvgTurnoversPerGame =
    teamStats.length > 0
      ? parseFloat(
          (
            teamStats.reduce((sum, t) => sum + t.turnoversPerGame, 0) /
            teamStats.length
          ).toFixed(2)
        )
      : 0;

  // Season trends
  const seasonMap = new Map<
    number,
    { totalTOs: number; gamesWithTOs: number }
  >();

  for (const g of games) {
    const season = g.season;
    if (!seasonMap.has(season)) {
      seasonMap.set(season, { totalTOs: 0, gamesWithTOs: 0 });
    }
    const entry = seasonMap.get(season)!;
    entry.totalTOs += g.homeTurnovers + g.awayTurnovers;
    entry.gamesWithTOs += 2;
  }

  const seasonTrends: TurnoverSeasonTrend[] = [...seasonMap.entries()]
    .map(([season, data]) => ({
      season,
      avgTurnoversPerGame: parseFloat(
        (data.totalTOs / data.gamesWithTOs).toFixed(2)
      ),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamStats: [...teamStats].sort(
      (a, b) => b.totalTurnovers - a.totalTurnovers
    ),
    leagueAvgTurnoversPerGame,
    bestTurnoverDiff,
    worstTurnoverDiff,
    seasonTrends,
  };
}
