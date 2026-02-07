/**
 * Pure betting value analysis — no DB dependency.
 * Identifies historical betting edges based on betting lines.
 */

export interface BettingGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  spread?: number | null;
  spreadResult?: string | null;
}

export interface BettingEdge {
  category: string;
  games: number;
  wins: number;
  losses: number;
  atsWinRate: string;
  roi: string;
}

export interface TeamATS {
  team: string;
  games: number;
  atsWins: number;
  atsLosses: number;
  winRate: string;
}

export interface BettingValueStats {
  totalGames: number;
  homeUnderdogs: BettingEdge;
  roadFavorites: BettingEdge;
  bigSpreads: BettingEdge;
  smallSpreads: BettingEdge;
  divisionalATS: BettingEdge;
  nonDivisionalATS: BettingEdge;
  bestATSTeams: TeamATS[];
  worstATSTeams: TeamATS[];
}

export interface BettingValueResult {
  stats: BettingValueStats;
}

function initEdge(): BettingEdge {
  return { category: "", games: 0, wins: 0, losses: 0, atsWinRate: ".000", roi: ".000" };
}

export function computeBettingValue(games: BettingGame[]): BettingValueResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        homeUnderdogs: initEdge(),
        roadFavorites: initEdge(),
        bigSpreads: initEdge(),
        smallSpreads: initEdge(),
        divisionalATS: initEdge(),
        nonDivisionalATS: initEdge(),
        bestATSTeams: [],
        worstATSTeams: [],
      },
    };
  }

  const edges = {
    homeUnderdogs: { ...initEdge(), category: "Home Underdogs" },
    roadFavorites: { ...initEdge(), category: "Road Favorites" },
    bigSpreads: { ...initEdge(), category: "Big Spreads (>10)" },
    smallSpreads: { ...initEdge(), category: "Small Spreads (<3)" },
    divisionalATS: { ...initEdge(), category: "Divisional Games" },
    nonDivisionalATS: { ...initEdge(), category: "Non-Divisional" },
  };

  const teamAtsMap = new Map<string, { games: number; wins: number; losses: number }>();

  for (const game of games) {
    const spread = game.spread ?? 0;
    const spreadResult = game.spreadResult || "PUSH";
    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;
    const isCovered = spreadResult === "COVERED";

    // Home underdogs: positive spread (away team favored)
    if (spread > 0) {
      edges.homeUnderdogs.games++;
      if (isCovered && homeWon) edges.homeUnderdogs.wins++;
      else if (!isCovered && homeWon) edges.homeUnderdogs.losses++;
    }

    // Road favorites: negative spread (home team favored, away team is road favorite to cover)
    if (spread < 0) {
      edges.roadFavorites.games++;
      if (isCovered) edges.roadFavorites.wins++;
      else edges.roadFavorites.losses++;
    }

    // Big spreads (>10)
    if (Math.abs(spread) > 10) {
      edges.bigSpreads.games++;
      if (isCovered) edges.bigSpreads.wins++;
      else edges.bigSpreads.losses++;
    }

    // Small spreads (<3)
    if (Math.abs(spread) < 3 && spread !== 0) {
      edges.smallSpreads.games++;
      if (isCovered) edges.smallSpreads.wins++;
      else edges.smallSpreads.losses++;
    }

    // Divisional games (simplified: true divisional based on division data would require team rosters)
    // For now, check if abbreviations start with same letter (rough approximation)
    const isDivisional = game.homeTeamAbbr.charAt(0) === game.awayTeamAbbr.charAt(0);
    if (isDivisional) {
      edges.divisionalATS.games++;
      if (isCovered) edges.divisionalATS.wins++;
      else edges.divisionalATS.losses++;
    } else {
      edges.nonDivisionalATS.games++;
      if (isCovered) edges.nonDivisionalATS.wins++;
      else edges.nonDivisionalATS.losses++;
    }

    // Team ATS records
    const homeTeam = teamAtsMap.get(game.homeTeamName) || { games: 0, wins: 0, losses: 0 };
    homeTeam.games++;
    if (isCovered && homeWon) homeTeam.wins++;
    else if (!isCovered && homeWon) homeTeam.losses++;
    teamAtsMap.set(game.homeTeamName, homeTeam);

    const awayTeam = teamAtsMap.get(game.awayTeamName) || { games: 0, wins: 0, losses: 0 };
    awayTeam.games++;
    if (isCovered && awayWon) awayTeam.wins++;
    else if (!isCovered && awayWon) awayTeam.losses++;
    teamAtsMap.set(game.awayTeamName, awayTeam);
  }

  // Calculate win rates and ROI
  for (const edge of Object.values(edges)) {
    if (edge.games > 0) {
      const decisions = edge.wins + edge.losses;
      edge.atsWinRate = decisions > 0 ? (edge.wins / decisions).toFixed(3) : ".000";
      // ROI: assume -110 odds, +100 on wins
      edge.roi = decisions > 0 ? ((edge.wins * 100 - edge.losses * 110) / (edge.losses * 110)).toFixed(3) : ".000";
    }
  }

  // Sort teams
  const allTeams = [...teamAtsMap.entries()]
    .filter(([, data]) => data.games > 0)
    .map(([team, data]) => ({
      team,
      games: data.games,
      atsWins: data.wins,
      atsLosses: data.losses,
      winRate: data.games > 0 ? (data.wins / data.games).toFixed(3) : ".000",
    }))
    .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));

  const bestATSTeams = allTeams.slice(0, 10);
  const worstATSTeams = allTeams.slice(-10).reverse();

  return {
    stats: {
      totalGames: games.length,
      homeUnderdogs: edges.homeUnderdogs,
      roadFavorites: edges.roadFavorites,
      bigSpreads: edges.bigSpreads,
      smallSpreads: edges.smallSpreads,
      divisionalATS: edges.divisionalATS,
      nonDivisionalATS: edges.nonDivisionalATS,
      bestATSTeams,
      worstATSTeams,
    },
  };
}
