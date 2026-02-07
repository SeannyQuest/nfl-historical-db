/**
 * Pure defensive matchup ratings computation — no DB dependency.
 * Analyzes defensive performance and identifies best/worst defenses.
 */

export interface DefMatchupGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamDefenseRating {
  team: string;
  season: number;
  ptsAllowedPerGame: number;
  gamesPlayed: number;
  shutouts: number;
  under14Games: number;
  under21Games: number;
  totalPtsAllowed: number;
}

export interface BestDefenseTeam {
  team: string;
  season: number;
  ptsAllowedPerGame: number;
  gamesPlayed: number;
  shutouts: number;
  under21Games: number;
  totalPtsAllowed: number;
}

export interface DefensiveMatchupPair {
  team1: string;
  team2: string;
  avgTotal: number;
  games: number;
  totalPointsInMatchups: number;
}

export interface SeasonDefenseTrend {
  season: number;
  leagueAvgPtsAllowed: number;
  gamesCount: number;
}

export interface DefensiveMatchupsResult {
  teamDefenseRatings: TeamDefenseRating[];
  bestDefenses: BestDefenseTeam[];
  worstDefenses: BestDefenseTeam[];
  defensiveMatchups: DefensiveMatchupPair[];
  seasonDefenseTrends: SeasonDefenseTrend[];
}

export function computeDefensiveMatchups(games: DefMatchupGame[]): DefensiveMatchupsResult {
  if (games.length === 0) {
    return {
      teamDefenseRatings: [],
      bestDefenses: [],
      worstDefenses: [],
      defensiveMatchups: [],
      seasonDefenseTrends: [],
    };
  }

  // Build team defense ratings
  const teamDefenseMap = new Map<string, Map<number, { ptsAllowed: number; games: number }>>();

  for (const game of games) {
    // Home team defense
    if (!teamDefenseMap.has(game.homeTeamName)) {
      teamDefenseMap.set(game.homeTeamName, new Map());
    }
    const homeSeasonMap = teamDefenseMap.get(game.homeTeamName)!;
    if (!homeSeasonMap.has(game.season)) {
      homeSeasonMap.set(game.season, { ptsAllowed: 0, games: 0 });
    }
    const homeData = homeSeasonMap.get(game.season)!;
    homeData.ptsAllowed += game.awayScore;
    homeData.games++;

    // Away team defense
    if (!teamDefenseMap.has(game.awayTeamName)) {
      teamDefenseMap.set(game.awayTeamName, new Map());
    }
    const awaySeasonMap = teamDefenseMap.get(game.awayTeamName)!;
    if (!awaySeasonMap.has(game.season)) {
      awaySeasonMap.set(game.season, { ptsAllowed: 0, games: 0 });
    }
    const awayData = awaySeasonMap.get(game.season)!;
    awayData.ptsAllowed += game.homeScore;
    awayData.games++;
  }

  // Count shutouts and low-scoring games
  const shutoutMap = new Map<string, Map<number, number>>();
  const under14Map = new Map<string, Map<number, number>>();
  const under21Map = new Map<string, Map<number, number>>();

  for (const game of games) {
    // Home team shutouts/low scoring
    if (game.awayScore === 0) {
      if (!shutoutMap.has(game.homeTeamName)) {
        shutoutMap.set(game.homeTeamName, new Map());
      }
      const shutoutSeason = shutoutMap.get(game.homeTeamName)!;
      shutoutSeason.set(game.season, (shutoutSeason.get(game.season) ?? 0) + 1);
    }

    if (game.awayScore < 14) {
      if (!under14Map.has(game.homeTeamName)) {
        under14Map.set(game.homeTeamName, new Map());
      }
      const u14Season = under14Map.get(game.homeTeamName)!;
      u14Season.set(game.season, (u14Season.get(game.season) ?? 0) + 1);
    }

    if (game.awayScore < 21) {
      if (!under21Map.has(game.homeTeamName)) {
        under21Map.set(game.homeTeamName, new Map());
      }
      const u21Season = under21Map.get(game.homeTeamName)!;
      u21Season.set(game.season, (u21Season.get(game.season) ?? 0) + 1);
    }

    // Away team shutouts/low scoring
    if (game.homeScore === 0) {
      if (!shutoutMap.has(game.awayTeamName)) {
        shutoutMap.set(game.awayTeamName, new Map());
      }
      const shutoutSeason = shutoutMap.get(game.awayTeamName)!;
      shutoutSeason.set(game.season, (shutoutSeason.get(game.season) ?? 0) + 1);
    }

    if (game.homeScore < 14) {
      if (!under14Map.has(game.awayTeamName)) {
        under14Map.set(game.awayTeamName, new Map());
      }
      const u14Season = under14Map.get(game.awayTeamName)!;
      u14Season.set(game.season, (u14Season.get(game.season) ?? 0) + 1);
    }

    if (game.homeScore < 21) {
      if (!under21Map.has(game.awayTeamName)) {
        under21Map.set(game.awayTeamName, new Map());
      }
      const u21Season = under21Map.get(game.awayTeamName)!;
      u21Season.set(game.season, (u21Season.get(game.season) ?? 0) + 1);
    }
  }

  // Build ratings
  const teamDefenseRatings: TeamDefenseRating[] = [];

  for (const [team, seasonMap] of teamDefenseMap.entries()) {
    for (const [season, data] of seasonMap.entries()) {
      const ptsAllowedPerGame = Math.round((data.ptsAllowed / data.games) * 100) / 100;
      const shutouts = shutoutMap.get(team)?.get(season) ?? 0;
      const under14 = under14Map.get(team)?.get(season) ?? 0;
      const under21 = under21Map.get(team)?.get(season) ?? 0;

      teamDefenseRatings.push({
        team,
        season,
        ptsAllowedPerGame,
        gamesPlayed: data.games,
        shutouts,
        under14Games: under14,
        under21Games: under21,
        totalPtsAllowed: data.ptsAllowed,
      });
    }
  }

  // Sort for best/worst
  const sortedByDefense = [...teamDefenseRatings].sort((a, b) => a.ptsAllowedPerGame - b.ptsAllowedPerGame);
  const best = sortedByDefense.slice(0, 10).map((r) => ({
    team: r.team,
    season: r.season,
    ptsAllowedPerGame: r.ptsAllowedPerGame,
    gamesPlayed: r.gamesPlayed,
    shutouts: r.shutouts,
    under21Games: r.under21Games,
    totalPtsAllowed: r.totalPtsAllowed,
  }));

  const worst = sortedByDefense.slice(-10).reverse().map((r) => ({
    team: r.team,
    season: r.season,
    ptsAllowedPerGame: r.ptsAllowedPerGame,
    gamesPlayed: r.gamesPlayed,
    shutouts: r.shutouts,
    under21Games: r.under21Games,
    totalPtsAllowed: r.totalPtsAllowed,
  }));

  // Find defensive matchup pairs (lowest scoring matchups)
  const matchupMap = new Map<string, { totalPts: number; games: number }>();

  for (const game of games) {
    const totalPts = game.homeScore + game.awayScore;
    // Create matchup key (sorted team names for uniqueness)
    const teams = [game.homeTeamName, game.awayTeamName].sort();
    const key = `${teams[0]}-${teams[1]}`;

    if (!matchupMap.has(key)) {
      matchupMap.set(key, { totalPts: 0, games: 0 });
    }
    const matchup = matchupMap.get(key)!;
    matchup.totalPts += totalPts;
    matchup.games++;
  }

  const defensiveMatchups: DefensiveMatchupPair[] = Array.from(matchupMap.entries())
    .map(([key, data]) => {
      const [team1, team2] = key.split("-");
      return {
        team1,
        team2,
        avgTotal: Math.round((data.totalPts / data.games) * 100) / 100,
        games: data.games,
        totalPointsInMatchups: data.totalPts,
      };
    })
    .sort((a, b) => a.avgTotal - b.avgTotal)
    .slice(0, 20);

  // Season defense trends
  const seasonDefenseMap = new Map<number, { totalPtsAllowed: number; gameCount: number }>();
  for (const rating of teamDefenseRatings) {
    if (!seasonDefenseMap.has(rating.season)) {
      seasonDefenseMap.set(rating.season, { totalPtsAllowed: 0, gameCount: 0 });
    }
    const seasonData = seasonDefenseMap.get(rating.season)!;
    seasonData.totalPtsAllowed += rating.totalPtsAllowed;
    seasonData.gameCount += rating.gamesPlayed;
  }

  const seasonDefenseTrends: SeasonDefenseTrend[] = Array.from(seasonDefenseMap.entries())
    .map(([season, data]) => ({
      season,
      leagueAvgPtsAllowed: Math.round((data.totalPtsAllowed / data.gameCount) * 100) / 100,
      gamesCount: data.gameCount,
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamDefenseRatings,
    bestDefenses: best,
    worstDefenses: worst,
    defensiveMatchups,
    seasonDefenseTrends,
  };
}
