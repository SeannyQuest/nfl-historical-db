/**
 * Pure franchise history computation — no DB dependency.
 * Operates on arrays of game-like objects to compute franchise-wide analytics.
 */

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  nickname: string;
  conference: string;
  division: string;
  franchiseKey: string;
  isActive: boolean;
}

export interface FranchiseGame {
  season: number;
  homeTeamName: string;
  homeTeamFranchiseKey: string;
  awayTeamName: string;
  awayTeamFranchiseKey: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  isSuperBowl: boolean;
}

export interface SeasonRecord {
  season: number;
  wins: number;
  losses: number;
  ties: number;
}

export interface FranchiseStats {
  franchiseKey: string;
  franchiseName: string;
  allNames: string[];
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  winPct: string;
  seasonRecords: SeasonRecord[];
  bestSeason: {
    season: number;
    wins: number;
    losses: number;
    ties: number;
  } | null;
  worstSeason: {
    season: number;
    wins: number;
    losses: number;
    ties: number;
  } | null;
  superBowlWins: number;
  superBowlAppearances: number;
}

export interface FranchiseHistoryResult {
  totalFranchises: number;
  franchises: FranchiseStats[];
}

export function computeFranchiseHistory(games: FranchiseGame[], teams: Team[]): FranchiseHistoryResult {
  if (games.length === 0 || teams.length === 0) {
    return {
      totalFranchises: 0,
      franchises: [],
    };
  }

  // Map franchise keys to all team names and create cumulative records
  const franchiseMap = new Map<
    string,
    {
      names: Set<string>;
      totalWins: number;
      totalLosses: number;
      totalTies: number;
      seasonRecords: Map<
        number,
        { wins: number; losses: number; ties: number }
      >;
      superBowlWins: number;
      superBowlAppearances: number;
    }
  >();

  // Initialize franchises from teams data
  for (const team of teams) {
    if (!franchiseMap.has(team.franchiseKey)) {
      franchiseMap.set(team.franchiseKey, {
        names: new Set([team.name]),
        totalWins: 0,
        totalLosses: 0,
        totalTies: 0,
        seasonRecords: new Map(),
        superBowlWins: 0,
        superBowlAppearances: 0,
      });
    } else {
      franchiseMap.get(team.franchiseKey)!.names.add(team.name);
    }
  }

  // Process games
  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    // Home team record
    if (franchiseMap.has(g.homeTeamFranchiseKey)) {
      const homeFranchise = franchiseMap.get(g.homeTeamFranchiseKey)!;
      homeFranchise.names.add(g.homeTeamName);

      if (homeWon) {
        homeFranchise.totalWins++;
      } else if (awayWon) {
        homeFranchise.totalLosses++;
      } else {
        homeFranchise.totalTies++;
      }

      // Season record
      if (!homeFranchise.seasonRecords.has(g.season)) {
        homeFranchise.seasonRecords.set(g.season, { wins: 0, losses: 0, ties: 0 });
      }
      const homeSeason = homeFranchise.seasonRecords.get(g.season)!;
      if (homeWon) {
        homeSeason.wins++;
      } else if (awayWon) {
        homeSeason.losses++;
      } else {
        homeSeason.ties++;
      }

      // Super Bowl
      if (g.isSuperBowl) {
        homeFranchise.superBowlAppearances++;
        if (homeWon) {
          homeFranchise.superBowlWins++;
        }
      }
    }

    // Away team record
    if (franchiseMap.has(g.awayTeamFranchiseKey)) {
      const awayFranchise = franchiseMap.get(g.awayTeamFranchiseKey)!;
      awayFranchise.names.add(g.awayTeamName);

      if (awayWon) {
        awayFranchise.totalWins++;
      } else if (homeWon) {
        awayFranchise.totalLosses++;
      } else {
        awayFranchise.totalTies++;
      }

      // Season record
      if (!awayFranchise.seasonRecords.has(g.season)) {
        awayFranchise.seasonRecords.set(g.season, { wins: 0, losses: 0, ties: 0 });
      }
      const awaySeason = awayFranchise.seasonRecords.get(g.season)!;
      if (awayWon) {
        awaySeason.wins++;
      } else if (homeWon) {
        awaySeason.losses++;
      } else {
        awaySeason.ties++;
      }

      // Super Bowl
      if (g.isSuperBowl) {
        awayFranchise.superBowlAppearances++;
        if (awayWon) {
          awayFranchise.superBowlWins++;
        }
      }
    }
  }

  // Build franchise stats
  const franchises: FranchiseStats[] = [...franchiseMap.entries()]
    .map(([key, data]) => {
      const allNames = [...data.names].sort();
      const totalGames = data.totalWins + data.totalLosses + data.totalTies;

      const seasonArray = [...data.seasonRecords.entries()]
        .sort(([a], [b]) => b - a)
        .map(([season, record]) => ({
          season,
          wins: record.wins,
          losses: record.losses,
          ties: record.ties,
        }));

      // Best season (most wins)
      let bestSeason: FranchiseStats["bestSeason"] = null;
      if (seasonArray.length > 0) {
        const best = [...seasonArray].sort((a, b) => {
          const aWinPct = a.wins / (a.wins + a.losses + a.ties);
          const bWinPct = b.wins / (b.wins + b.losses + b.ties);
          if (bWinPct !== aWinPct) return bWinPct - aWinPct;
          return b.wins - a.wins;
        })[0];
        bestSeason = best;
      }

      // Worst season (least wins)
      let worstSeason: FranchiseStats["worstSeason"] = null;
      if (seasonArray.length > 0) {
        const worst = [...seasonArray].sort((a, b) => {
          const aWinPct = a.wins / (a.wins + a.losses + a.ties);
          const bWinPct = b.wins / (b.wins + b.losses + b.ties);
          if (aWinPct !== bWinPct) return aWinPct - bWinPct;
          return a.wins - b.wins;
        })[0];
        worstSeason = worst;
      }

      return {
        franchiseKey: key,
        franchiseName: allNames[0],
        allNames,
        totalWins: data.totalWins,
        totalLosses: data.totalLosses,
        totalTies: data.totalTies,
        winPct:
          totalGames > 0
            ? ((data.totalWins / (data.totalWins + data.totalLosses)) * 100).toFixed(1) + "%"
            : ".000",
        seasonRecords: seasonArray,
        bestSeason,
        worstSeason,
        superBowlWins: data.superBowlWins,
        superBowlAppearances: data.superBowlAppearances,
      };
    })
    .sort((a, b) => b.totalWins - a.totalWins);

  return {
    totalFranchises: franchiseMap.size,
    franchises,
  };
}
