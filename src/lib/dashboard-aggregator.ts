/**
 * Pure dashboard data aggregation — no DB dependency.
 * High-level summary suitable for main dashboard display.
 */

export interface DashboardGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  primetime: boolean;
  homeConference: string;
  awayConference: string;
}

export interface TeamWins {
  team: string;
  wins: number;
}

export interface ConferenceWins {
  wins: number;
  losses: number;
}

export interface SeasonHighlight {
  season: number;
  totalGames: number;
  avgPts: string;
  homeWinPct: string;
}

export interface ConferenceBalance {
  afc: ConferenceWins;
  nfc: ConferenceWins;
}

export interface DashboardDataResult {
  totalGames: number;
  totalSeasons: number;
  avgPointsPerGame: string;
  homeWinPct: string;
  playoffGames: number;
  primetimeGames: number;
  topTeamsByWins: TeamWins[];
  seasonHighlights: SeasonHighlight[];
  conferenceBalance: ConferenceBalance;
}

export function computeDashboardData(
  games: DashboardGame[]
): DashboardDataResult {
  if (games.length === 0) {
    return {
      totalGames: 0,
      totalSeasons: 0,
      avgPointsPerGame: "0.0",
      homeWinPct: "0.000",
      playoffGames: 0,
      primetimeGames: 0,
      topTeamsByWins: [],
      seasonHighlights: [],
      conferenceBalance: {
        afc: { wins: 0, losses: 0 },
        nfc: { wins: 0, losses: 0 },
      },
    };
  }

  // Track overall stats
  let totalPoints = 0;
  let homeWins = 0;
  let playoffGames = 0;
  let primetimeGames = 0;

  // Track team wins
  const teamWinsMap = new Map<string, number>();

  // Track season stats
  const seasonStatsMap = new Map<
    number,
    {
      games: number;
      totalPoints: number;
      homeWins: number;
    }
  >();

  // Track conference balance
  const conferenceWinsMap = new Map<string, { wins: number; losses: number }>();

  for (const game of games) {
    const homeWon = game.homeScore > game.awayScore;
    const total = game.homeScore + game.awayScore;

    totalPoints += total;
    if (homeWon) homeWins++;
    if (game.isPlayoff) playoffGames++;
    if (game.primetime) primetimeGames++;

    // Team wins
    if (!teamWinsMap.has(game.homeTeamName)) {
      teamWinsMap.set(game.homeTeamName, 0);
    }
    if (!teamWinsMap.has(game.awayTeamName)) {
      teamWinsMap.set(game.awayTeamName, 0);
    }
    if (homeWon) {
      teamWinsMap.set(
        game.homeTeamName,
        teamWinsMap.get(game.homeTeamName)! + 1
      );
    } else {
      teamWinsMap.set(
        game.awayTeamName,
        teamWinsMap.get(game.awayTeamName)! + 1
      );
    }

    // Season stats
    if (!seasonStatsMap.has(game.season)) {
      seasonStatsMap.set(game.season, {
        games: 0,
        totalPoints: 0,
        homeWins: 0,
      });
    }
    const seasonStats = seasonStatsMap.get(game.season)!;
    seasonStats.games++;
    seasonStats.totalPoints += total;
    if (homeWon) seasonStats.homeWins++;

    // Conference balance
    if (!conferenceWinsMap.has(game.homeConference)) {
      conferenceWinsMap.set(game.homeConference, { wins: 0, losses: 0 });
    }
    if (!conferenceWinsMap.has(game.awayConference)) {
      conferenceWinsMap.set(game.awayConference, { wins: 0, losses: 0 });
    }
    const homeConfStats = conferenceWinsMap.get(game.homeConference)!;
    const awayConfStats = conferenceWinsMap.get(game.awayConference)!;
    if (homeWon) {
      homeConfStats.wins++;
      awayConfStats.losses++;
    } else {
      homeConfStats.losses++;
      awayConfStats.wins++;
    }
  }

  // Compute percentages
  const avgPointsPerGame = (totalPoints / (games.length * 2)).toFixed(1);
  const homeWinPct = (homeWins / games.length).toFixed(3);

  // Top teams by wins
  const topTeamsByWins: TeamWins[] = Array.from(teamWinsMap.entries())
    .map(([team, wins]) => ({ team, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  // Season highlights
  const seasonHighlights: SeasonHighlight[] = Array.from(
    seasonStatsMap.entries()
  )
    .sort((a, b) => b[0] - a[0])
    .map(([season, stats]) => ({
      season,
      totalGames: stats.games,
      avgPts: (stats.totalPoints / (stats.games * 2)).toFixed(1),
      homeWinPct: (stats.homeWins / stats.games).toFixed(3),
    }));

  // Get unique seasons
  const uniqueSeasons = new Set(games.map((g) => g.season));

  // Conference balance
  const afcStats = conferenceWinsMap.get("AFC") || { wins: 0, losses: 0 };
  const nfcStats = conferenceWinsMap.get("NFC") || { wins: 0, losses: 0 };

  return {
    totalGames: games.length,
    totalSeasons: uniqueSeasons.size,
    avgPointsPerGame,
    homeWinPct,
    playoffGames,
    primetimeGames,
    topTeamsByWins,
    seasonHighlights,
    conferenceBalance: {
      afc: afcStats,
      nfc: nfcStats,
    },
  };
}
