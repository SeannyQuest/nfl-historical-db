/**
 * Pure divisional round predictor — no DB dependency.
 * Analyzes divisional performance patterns in playoffs.
 */

export interface DivPredGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  homeDivision: string;
  awayDivision: string;
}

export interface DivisionPlayoffStats {
  division: string;
  playoffWins: number;
  playoffLosses: number;
  playoffWinPct: number;
}

export interface HomeFieldPlayoffStats {
  homeWins: number;
  homeLosses: number;
  homeWinPct: number;
}

export interface DivisionalPredictorResult {
  divisionWinPctInPlayoffs: DivisionPlayoffStats[];
  regularSeasonPlayoffCorrelation: number;
  homeFieldInPlayoffs: HomeFieldPlayoffStats;
  upsetRate: number;
}

export function computeDivisionalPredictor(
  games: DivPredGame[]
): DivisionalPredictorResult {
  if (games.length === 0) {
    return {
      divisionWinPctInPlayoffs: [],
      regularSeasonPlayoffCorrelation: 0,
      homeFieldInPlayoffs: { homeWins: 0, homeLosses: 0, homeWinPct: 0 },
      upsetRate: 0,
    };
  }

  // Split into regular season and playoff
  const regularSeason = games.filter((g) => !g.isPlayoff);
  const playoffGames = games.filter((g) => g.isPlayoff);

  // Division playoff stats
  const divPlayoffMap = new Map<
    string,
    { wins: number; losses: number }
  >();

  for (const g of playoffGames) {
    const homeWon = g.homeScore > g.awayScore;

    if (!divPlayoffMap.has(g.homeDivision)) {
      divPlayoffMap.set(g.homeDivision, { wins: 0, losses: 0 });
    }
    if (!divPlayoffMap.has(g.awayDivision)) {
      divPlayoffMap.set(g.awayDivision, { wins: 0, losses: 0 });
    }

    const homeDiv = divPlayoffMap.get(g.homeDivision)!;
    const awayDiv = divPlayoffMap.get(g.awayDivision)!;

    if (homeWon) {
      homeDiv.wins++;
      awayDiv.losses++;
    } else {
      homeDiv.losses++;
      awayDiv.wins++;
    }
  }

  const divisionWinPctInPlayoffs: DivisionPlayoffStats[] = Array.from(
    divPlayoffMap.entries()
  )
    .map(([division, data]) => {
      const total = data.wins + data.losses;
      return {
        division,
        playoffWins: data.wins,
        playoffLosses: data.losses,
        playoffWinPct:
          total > 0
            ? Math.round((data.wins / total) * 10000) / 10000
            : 0,
      };
    })
    .sort((a, b) => b.playoffWinPct - a.playoffWinPct);

  // Regular season playoff correlation
  // Build team regular season records
  interface TeamRecord {
    wins: number;
    losses: number;
  }

  const regSeasonMap = new Map<string, TeamRecord>();

  for (const g of regularSeason) {
    const homeWon = g.homeScore > g.awayScore;

    if (!regSeasonMap.has(g.homeTeamName)) {
      regSeasonMap.set(g.homeTeamName, { wins: 0, losses: 0 });
    }
    if (!regSeasonMap.has(g.awayTeamName)) {
      regSeasonMap.set(g.awayTeamName, { wins: 0, losses: 0 });
    }

    const homeRec = regSeasonMap.get(g.homeTeamName)!;
    const awayRec = regSeasonMap.get(g.awayTeamName)!;

    if (homeWon) {
      homeRec.wins++;
      awayRec.losses++;
    } else {
      homeRec.losses++;
      awayRec.wins++;
    }
  }

  // Calculate correlation: higher seed (better record) wins more
  const playoffWithRecords: { teamName: string; regWinPct: number; playoffWin: boolean }[] = [];

  for (const g of playoffGames) {
    const homeRec = regSeasonMap.get(g.homeTeamName);
    const awayRec = regSeasonMap.get(g.awayTeamName);

    if (homeRec && awayRec) {
      const homeWinPct =
        homeRec.wins + homeRec.losses > 0
          ? homeRec.wins / (homeRec.wins + homeRec.losses)
          : 0;
      const awayWinPct =
        awayRec.wins + awayRec.losses > 0
          ? awayRec.wins / (awayRec.wins + awayRec.losses)
          : 0;

      const homeWon = g.homeScore > g.awayScore;

      playoffWithRecords.push({
        teamName: g.homeTeamName,
        regWinPct: homeWinPct,
        playoffWin: homeWon,
      });

      playoffWithRecords.push({
        teamName: g.awayTeamName,
        regWinPct: awayWinPct,
        playoffWin: !homeWon,
      });
    }
  }

  // Correlation: percentage of playoff wins for teams with better record
  let betterSeedWins = 0;
  for (const record of playoffWithRecords) {
    if (record.playoffWin) {
      betterSeedWins++;
    }
  }

  const regularSeasonPlayoffCorrelation =
    playoffWithRecords.length > 0
      ? Math.round(
          (betterSeedWins / playoffWithRecords.length) * 10000
        ) / 10000
      : 0;

  // Home field advantage in playoffs
  let homePlayoffWins = 0;
  const totalPlayoffGames = playoffGames.length;

  for (const g of playoffGames) {
    if (g.homeScore > g.awayScore) {
      homePlayoffWins++;
    }
  }

  const homeFieldInPlayoffs: HomeFieldPlayoffStats = {
    homeWins: homePlayoffWins,
    homeLosses: totalPlayoffGames - homePlayoffWins,
    homeWinPct:
      totalPlayoffGames > 0
        ? Math.round((homePlayoffWins / totalPlayoffGames) * 10000) / 10000
        : 0,
  };

  // Upset rate: lower seed (worse regular season record) wins
  let upsets = 0;

  for (const g of playoffGames) {
    const homeRec = regSeasonMap.get(g.homeTeamName);
    const awayRec = regSeasonMap.get(g.awayTeamName);

    if (homeRec && awayRec) {
      const homeWinPct =
        homeRec.wins + homeRec.losses > 0
          ? homeRec.wins / (homeRec.wins + homeRec.losses)
          : 0;
      const awayWinPct =
        awayRec.wins + awayRec.losses > 0
          ? awayRec.wins / (awayRec.wins + awayRec.losses)
          : 0;

      const homeWon = g.homeScore > g.awayScore;

      // Upset: lower seed wins
      if (homeWon && awayWinPct > homeWinPct) {
        upsets++;
      } else if (!homeWon && homeWinPct > awayWinPct) {
        upsets++;
      }
    }
  }

  const upsetRate =
    playoffGames.length > 0
      ? Math.round((upsets / playoffGames.length) * 10000) / 10000
      : 0;

  return {
    divisionWinPctInPlayoffs,
    regularSeasonPlayoffCorrelation,
    homeFieldInPlayoffs,
    upsetRate,
  };
}
