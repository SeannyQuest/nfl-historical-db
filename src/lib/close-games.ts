/**
 * Pure close games analysis — no DB dependency.
 * Operates on arrays of game-like objects to compute close games analytics.
 */

export interface CloseGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  primetime?: boolean;
}

export interface CloseGameRecord {
  team: string;
  gamesAt3Pts: number;
  winsAt3Pts: number;
  gamesAt7Pts: number;
  winsAt7Pts: number;
  gamesAt10Pts: number;
  winsAt10Pts: number;
}

export interface CloseGameStats {
  totalGames: number;
  gamesAt3Pts: number;
  gamesAt7Pts: number;
  gamesAt10Pts: number;
  closeGameRateAt3Pts: string;
  closeGameRateAt7Pts: string;
  closeGameRateAt10Pts: string;
  bestClutchTeams: CloseGameRecord[];
  worstClutchTeams: CloseGameRecord[];
  primetimeCloseGames: number;
  primetimeCloseGameRate: string;
}

export interface CloseGamesResult {
  stats: CloseGameStats;
}

export function computeCloseGames(games: CloseGame[]): CloseGamesResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        gamesAt3Pts: 0,
        gamesAt7Pts: 0,
        gamesAt10Pts: 0,
        closeGameRateAt3Pts: ".000",
        closeGameRateAt7Pts: ".000",
        closeGameRateAt10Pts: ".000",
        bestClutchTeams: [],
        worstClutchTeams: [],
        primetimeCloseGames: 0,
        primetimeCloseGameRate: ".000",
      },
    };
  }

  // Count close games by threshold
  const gamesAt3Pts = games.filter((g) => Math.abs(g.homeScore - g.awayScore) <= 3 && g.homeScore !== g.awayScore).length;
  const gamesAt7Pts = games.filter((g) => Math.abs(g.homeScore - g.awayScore) <= 7 && g.homeScore !== g.awayScore).length;
  const gamesAt10Pts = games.filter((g) => Math.abs(g.homeScore - g.awayScore) <= 10 && g.homeScore !== g.awayScore).length;

  // Primetime close games (≤3 points)
  const primetimeCloseGames = games.filter((g) => g.primetime && Math.abs(g.homeScore - g.awayScore) <= 3 && g.homeScore !== g.awayScore).length;

  // Build team clutch records
  const teamClutchMap = new Map<string, CloseGameRecord>();

  for (const game of games) {
    const margin = Math.abs(game.homeScore - game.awayScore);
    if (margin === 0) continue; // Skip ties

    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;

    // Process home team
    const homeTeam = teamClutchMap.get(game.homeTeamName) || {
      team: game.homeTeamName,
      gamesAt3Pts: 0,
      winsAt3Pts: 0,
      gamesAt7Pts: 0,
      winsAt7Pts: 0,
      gamesAt10Pts: 0,
      winsAt10Pts: 0,
    };

    if (margin <= 10) {
      homeTeam.gamesAt10Pts++;
      if (homeWon) homeTeam.winsAt10Pts++;
    }
    if (margin <= 7) {
      homeTeam.gamesAt7Pts++;
      if (homeWon) homeTeam.winsAt7Pts++;
    }
    if (margin <= 3) {
      homeTeam.gamesAt3Pts++;
      if (homeWon) homeTeam.winsAt3Pts++;
    }

    teamClutchMap.set(game.homeTeamName, homeTeam);

    // Process away team
    const awayTeam = teamClutchMap.get(game.awayTeamName) || {
      team: game.awayTeamName,
      gamesAt3Pts: 0,
      winsAt3Pts: 0,
      gamesAt7Pts: 0,
      winsAt7Pts: 0,
      gamesAt10Pts: 0,
      winsAt10Pts: 0,
    };

    if (margin <= 10) {
      awayTeam.gamesAt10Pts++;
      if (awayWon) awayTeam.winsAt10Pts++;
    }
    if (margin <= 7) {
      awayTeam.gamesAt7Pts++;
      if (awayWon) awayTeam.winsAt7Pts++;
    }
    if (margin <= 3) {
      awayTeam.gamesAt3Pts++;
      if (awayWon) awayTeam.winsAt3Pts++;
    }

    teamClutchMap.set(game.awayTeamName, awayTeam);
  }

  // Sort and limit teams
  const allTeams = [...teamClutchMap.values()]
    .filter((t) => t.gamesAt3Pts > 0 || t.gamesAt7Pts > 0 || t.gamesAt10Pts > 0)
    .sort((a, b) => {
      const aWinRate = a.gamesAt7Pts > 0 ? a.winsAt7Pts / a.gamesAt7Pts : 0;
      const bWinRate = b.gamesAt7Pts > 0 ? b.winsAt7Pts / b.gamesAt7Pts : 0;
      return bWinRate - aWinRate;
    });

  const bestClutchTeams = allTeams.slice(0, 10);
  const worstClutchTeams = allTeams.slice(-10).reverse();

  return {
    stats: {
      totalGames: games.length,
      gamesAt3Pts,
      gamesAt7Pts,
      gamesAt10Pts,
      closeGameRateAt3Pts: games.length > 0 ? (gamesAt3Pts / games.length).toFixed(3) : ".000",
      closeGameRateAt7Pts: games.length > 0 ? (gamesAt7Pts / games.length).toFixed(3) : ".000",
      closeGameRateAt10Pts: games.length > 0 ? (gamesAt10Pts / games.length).toFixed(3) : ".000",
      bestClutchTeams,
      worstClutchTeams,
      primetimeCloseGames,
      primetimeCloseGameRate: games.filter((g) => g.primetime).length > 0
        ? (primetimeCloseGames / games.filter((g) => g.primetime).length).toFixed(3)
        : ".000",
    },
  };
}
