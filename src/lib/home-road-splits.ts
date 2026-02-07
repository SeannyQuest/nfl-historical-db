/**
 * Pure home/road splits analysis — no DB dependency.
 */

export interface HomeRoadGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  primetime: boolean;
}

export interface TeamSplit {
  team: string;
  homeWins: number;
  homeLosses: number;
  homeWinPct: number;
  awayWins: number;
  awayLosses: number;
  awayWinPct: number;
  homePtsPerGame: number;
  awayPtsPerGame: number;
  splitDifferential: number;
}

export interface PrimetimeSplits {
  homeWinPct: number;
  awayWinPct: number;
}

export interface HomeRoadSeasonTrend {
  season: number;
  leagueHomeWinPct: number;
  leagueAwayWinPct: number;
}

export interface HomeRoadResult {
  teamSplits: TeamSplit[];
  biggestHomeSplits: TeamSplit[];
  bestRoadTeams: TeamSplit[];
  worstRoadTeams: TeamSplit[];
  primetimeSplits: PrimetimeSplits;
  seasonTrends: HomeRoadSeasonTrend[];
}

export function computeHomeRoadSplits(games: HomeRoadGame[]): HomeRoadResult {
  if (games.length === 0) {
    return {
      teamSplits: [],
      biggestHomeSplits: [],
      bestRoadTeams: [],
      worstRoadTeams: [],
      primetimeSplits: { homeWinPct: 0, awayWinPct: 0 },
      seasonTrends: [],
    };
  }

  const teamMap = new Map<
    string,
    {
      homeWins: number;
      homeLosses: number;
      homePoints: number;
      awayWins: number;
      awayLosses: number;
      awayPoints: number;
    }
  >();

  for (const g of games) {
    const homeEntry = teamMap.get(g.homeTeamName) || {
      homeWins: 0,
      homeLosses: 0,
      homePoints: 0,
      awayWins: 0,
      awayLosses: 0,
      awayPoints: 0,
    };
    const awayEntry = teamMap.get(g.awayTeamName) || {
      homeWins: 0,
      homeLosses: 0,
      homePoints: 0,
      awayWins: 0,
      awayLosses: 0,
      awayPoints: 0,
    };

    homeEntry.homePoints += g.homeScore;
    awayEntry.awayPoints += g.awayScore;

    if (g.homeScore > g.awayScore) {
      homeEntry.homeWins++;
      awayEntry.awayLosses++;
    } else {
      homeEntry.homeLosses++;
      awayEntry.awayWins++;
    }

    teamMap.set(g.homeTeamName, homeEntry);
    teamMap.set(g.awayTeamName, awayEntry);
  }

  const teamSplits: TeamSplit[] = [...teamMap.entries()]
    .map(([team, stats]) => {
      const homeGames = stats.homeWins + stats.homeLosses;
      const awayGames = stats.awayWins + stats.awayLosses;

      const homeWinPct =
        homeGames > 0
          ? parseFloat((stats.homeWins / homeGames).toFixed(3))
          : 0;
      const awayWinPct =
        awayGames > 0
          ? parseFloat((stats.awayWins / awayGames).toFixed(3))
          : 0;

      const homePtsPerGame =
        homeGames > 0
          ? parseFloat((stats.homePoints / homeGames).toFixed(1))
          : 0;
      const awayPtsPerGame =
        awayGames > 0
          ? parseFloat((stats.awayPoints / awayGames).toFixed(1))
          : 0;

      return {
        team,
        homeWins: stats.homeWins,
        homeLosses: stats.homeLosses,
        homeWinPct,
        awayWins: stats.awayWins,
        awayLosses: stats.awayLosses,
        awayWinPct,
        homePtsPerGame,
        awayPtsPerGame,
        splitDifferential: parseFloat((homeWinPct - awayWinPct).toFixed(3)),
      };
    })
    .sort((a, b) => b.splitDifferential - a.splitDifferential);

  const biggestHomeSplits = teamSplits.slice(0, 10);
  const sortedByAwayWins = [...teamSplits].sort((a, b) => b.awayWinPct - a.awayWinPct);
  const bestRoadTeams = sortedByAwayWins.slice(0, 10);
  const worstRoadTeams = sortedByAwayWins.slice(-10).reverse();

  // Primetime splits
  let primetimeHomeWins = 0;
  let primetimeHomeLosses = 0;
  let primetimeAwayWins = 0;
  let primetimeAwayLosses = 0;

  for (const g of games) {
    if (g.primetime) {
      if (g.homeScore > g.awayScore) {
        primetimeHomeWins++;
        primetimeAwayLosses++;
      } else {
        primetimeHomeLosses++;
        primetimeAwayWins++;
      }
    }
  }

  const primetimeHomeTotal = primetimeHomeWins + primetimeHomeLosses;
  const primetimeAwayTotal = primetimeAwayWins + primetimeAwayLosses;

  const primetimeSplits: PrimetimeSplits = {
    homeWinPct:
      primetimeHomeTotal > 0
        ? parseFloat((primetimeHomeWins / primetimeHomeTotal).toFixed(3))
        : 0,
    awayWinPct:
      primetimeAwayTotal > 0
        ? parseFloat((primetimeAwayWins / primetimeAwayTotal).toFixed(3))
        : 0,
  };

  // Season trends
  const seasonMap = new Map<
    number,
    { homeWins: number; homeLosses: number; awayWins: number; awayLosses: number }
  >();

  for (const g of games) {
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, {
        homeWins: 0,
        homeLosses: 0,
        awayWins: 0,
        awayLosses: 0,
      });
    }
    const entry = seasonMap.get(g.season)!;

    if (g.homeScore > g.awayScore) {
      entry.homeWins++;
      entry.awayLosses++;
    } else {
      entry.homeLosses++;
      entry.awayWins++;
    }
  }

  const seasonTrends: HomeRoadSeasonTrend[] = [...seasonMap.entries()]
    .map(([season, data]) => {
      const homeTotal = data.homeWins + data.homeLosses;
      const awayTotal = data.awayWins + data.awayLosses;
      return {
        season,
        leagueHomeWinPct:
          homeTotal > 0
            ? parseFloat((data.homeWins / homeTotal).toFixed(3))
            : 0,
        leagueAwayWinPct:
          awayTotal > 0
            ? parseFloat((data.awayWins / awayTotal).toFixed(3))
            : 0,
      };
    })
    .sort((a, b) => a.season - b.season);

  return {
    teamSplits,
    biggestHomeSplits,
    bestRoadTeams,
    worstRoadTeams,
    primetimeSplits,
    seasonTrends,
  };
}
