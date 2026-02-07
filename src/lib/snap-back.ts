/**
 * Pure snap-back effect analysis — no DB dependency.
 * Measures team performance following blowout wins/losses.
 */

export interface SnapBackGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface SnapBackStats {
  games: number;
  winPct: number;
  avgMargin: number;
}

export interface TeamSnapBackRecord {
  team: string;
  afterBigLossWins: number;
  afterBigLossLosses: number;
  afterBigLossWinPct: number;
  afterBigWinWins: number;
  afterBigWinLosses: number;
  afterBigWinWinPct: number;
}

export interface SnapBackResult {
  afterBlowoutLoss: SnapBackStats;
  afterBlowoutWin: SnapBackStats;
  teamSnapBack: TeamSnapBackRecord[];
  bestBounceback: TeamSnapBackRecord[];
}

export function computeSnapBackEffect(
  games: SnapBackGame[]
): SnapBackResult {
  if (games.length === 0) {
    return {
      afterBlowoutLoss: { games: 0, winPct: 0, avgMargin: 0 },
      afterBlowoutWin: { games: 0, winPct: 0, avgMargin: 0 },
      teamSnapBack: [],
      bestBounceback: [],
    };
  }

  // Sort games by season and week to track follow-ups
  const sortedGames = [...games].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });

  // Map teams to their game sequence
  interface TeamGameSequence {
    games: SnapBackGame[];
  }

  const teamGamesMap = new Map<string, TeamGameSequence>();

  for (const g of sortedGames) {
    if (!teamGamesMap.has(g.homeTeamName)) {
      teamGamesMap.set(g.homeTeamName, { games: [] });
    }
    if (!teamGamesMap.has(g.awayTeamName)) {
      teamGamesMap.set(g.awayTeamName, { games: [] });
    }

    teamGamesMap.get(g.homeTeamName)!.games.push(g);
    teamGamesMap.get(g.awayTeamName)!.games.push(g);
  }

  // Find blowout games and next game results
  const afterLossGames: SnapBackGame[] = [];
  const afterWinGames: SnapBackGame[] = [];

  for (const [team, gameSeq] of teamGamesMap.entries()) {
    const teamGames = gameSeq.games
      .filter((g) => g.homeTeamName === team || g.awayTeamName === team)
      .sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.week - b.week;
      });

    for (let i = 0; i < teamGames.length - 1; i++) {
      const current = teamGames[i];
      const next = teamGames[i + 1];

      // Only consider same season consecutive weeks
      if (current.season !== next.season || next.week !== current.week + 1) {
        continue;
      }

      const isHomeTeam = current.homeTeamName === team;
      const currentScore = isHomeTeam ? current.homeScore : current.awayScore;
      const opponentScore = isHomeTeam ? current.awayScore : current.homeScore;
      const margin = Math.abs(currentScore - opponentScore);

      // Blowout loss: 20+ point loss
      if (margin >= 20 && currentScore < opponentScore) {
        afterLossGames.push(next);
      }

      // Blowout win: 20+ point win
      if (margin >= 20 && currentScore > opponentScore) {
        afterWinGames.push(next);
      }
    }
  }

  // Calculate after blowout loss stats
  let afterLossWins = 0;
  let afterLossTotalMargin = 0;

  for (const g of afterLossGames) {
    if (g.homeScore > g.awayScore) {
      afterLossWins++;
      afterLossTotalMargin += g.homeScore - g.awayScore;
    } else {
      afterLossTotalMargin += g.awayScore - g.homeScore;
    }
  }

  const afterBlowoutLoss: SnapBackStats = {
    games: afterLossGames.length,
    winPct:
      afterLossGames.length > 0
        ? Math.round((afterLossWins / afterLossGames.length) * 10000) / 10000
        : 0,
    avgMargin:
      afterLossGames.length > 0
        ? Math.round(
            (afterLossTotalMargin / afterLossGames.length) * 100
          ) / 100
        : 0,
  };

  // Calculate after blowout win stats
  let afterWinWins = 0;
  let afterWinTotalMargin = 0;

  for (const g of afterWinGames) {
    if (g.homeScore > g.awayScore) {
      afterWinWins++;
      afterWinTotalMargin += g.homeScore - g.awayScore;
    } else {
      afterWinTotalMargin += g.awayScore - g.homeScore;
    }
  }

  const afterBlowoutWin: SnapBackStats = {
    games: afterWinGames.length,
    winPct:
      afterWinGames.length > 0
        ? Math.round((afterWinWins / afterWinGames.length) * 10000) / 10000
        : 0,
    avgMargin:
      afterWinGames.length > 0
        ? Math.round((afterWinTotalMargin / afterWinGames.length) * 100) / 100
        : 0,
  };

  // Team snap-back records
  const teamSnapMap = new Map<
    string,
    {
      afterBigLossWins: number;
      afterBigLosses: number;
      afterBigWinWins: number;
      afterBigWinLosses: number;
    }
  >();

  for (const [team, gameSeq] of teamGamesMap.entries()) {
    const teamGames = gameSeq.games
      .filter((g) => g.homeTeamName === team || g.awayTeamName === team)
      .sort((a, b) => {
        if (a.season !== b.season) return a.season - b.season;
        return a.week - b.week;
      });

    let afterBigLossWins = 0,
      afterBigLosses = 0;
    let afterBigWinWins = 0,
      afterBigWinLosses = 0;

    for (let i = 0; i < teamGames.length - 1; i++) {
      const current = teamGames[i];
      const next = teamGames[i + 1];

      if (
        current.season !== next.season ||
        next.week !== current.week + 1
      ) {
        continue;
      }

      const isHomeTeam = current.homeTeamName === team;
      const currentScore = isHomeTeam ? current.homeScore : current.awayScore;
      const opponentScore = isHomeTeam ? current.awayScore : current.homeScore;
      const margin = Math.abs(currentScore - opponentScore);

      const nextIsHome = next.homeTeamName === team;
      const nextWon =
        nextIsHome ? next.homeScore > next.awayScore : next.awayScore > next.homeScore;

      if (margin >= 20 && currentScore < opponentScore) {
        if (nextWon) {
          afterBigLossWins++;
        } else {
          afterBigLosses++;
        }
      }

      if (margin >= 20 && currentScore > opponentScore) {
        if (nextWon) {
          afterBigWinWins++;
        } else {
          afterBigWinLosses++;
        }
      }
    }

    if (
      afterBigLossWins > 0 ||
      afterBigLosses > 0 ||
      afterBigWinWins > 0 ||
      afterBigWinLosses > 0
    ) {
      teamSnapMap.set(team, {
        afterBigLossWins,
        afterBigLosses,
        afterBigWinWins,
        afterBigWinLosses,
      });
    }
  }

  const teamSnapBack: TeamSnapBackRecord[] = Array.from(teamSnapMap.entries())
    .map(([team, data]) => {
      const afterLossTotal = data.afterBigLossWins + data.afterBigLosses;
      const afterWinTotal = data.afterBigWinWins + data.afterBigWinLosses;

      return {
        team,
        afterBigLossWins: data.afterBigLossWins,
        afterBigLossLosses: data.afterBigLosses,
        afterBigLossWinPct:
          afterLossTotal > 0
            ? Math.round((data.afterBigLossWins / afterLossTotal) * 10000) /
              10000
            : 0,
        afterBigWinWins: data.afterBigWinWins,
        afterBigWinLosses: data.afterBigWinLosses,
        afterBigWinWinPct:
          afterWinTotal > 0
            ? Math.round((data.afterBigWinWins / afterWinTotal) * 10000) /
              10000
            : 0,
      };
    })
    .sort((a, b) => b.afterBigLossWinPct - a.afterBigLossWinPct);

  // Best bounce-back teams
  const bestBounceback = teamSnapBack
    .filter((t) => t.afterBigLossWins + t.afterBigLossLosses > 0)
    .slice(0, 10);

  return {
    afterBlowoutLoss,
    afterBlowoutWin,
    teamSnapBack,
    bestBounceback,
  };
}
