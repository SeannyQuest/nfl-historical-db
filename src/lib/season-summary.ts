/**
 * Pure season summary generation — no DB dependency.
 * Aggregates season-level statistics and highlights.
 */

export interface SummaryGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  homeConference: string;
}

export interface TeamRecord {
  team: string;
  wins: number;
  losses: number;
}

export interface GameHighlight {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  total: number;
}

export interface SeasonHighlight {
  season: number;
  totalGames: number;
  avgPts: string;
  homeWinPct: string;
}

export interface ConferenceBalance {
  afc: {
    wins: number;
    losses: number;
  };
  nfc: {
    wins: number;
    losses: number;
  };
}

export interface SeasonSummaryResult {
  champion: string;
  bestRecord: TeamRecord;
  worstRecord: TeamRecord;
  highestScoringGame: GameHighlight;
  avgPointsPerGame: string;
  playoffTeams: string[];
  totalGames: number;
  overtimeGames: number;
}

export function computeSeasonSummary(
  games: SummaryGame[],
  season: number
): SeasonSummaryResult {
  // Filter to specific season
  const seasonGames = games.filter((g) => g.season === season);

  if (seasonGames.length === 0) {
    return {
      champion: "Unknown",
      bestRecord: { team: "Unknown", wins: 0, losses: 0 },
      worstRecord: { team: "Unknown", wins: 0, losses: 0 },
      highestScoringGame: {
        homeTeam: "Unknown",
        awayTeam: "Unknown",
        homeScore: 0,
        awayScore: 0,
        total: 0,
      },
      avgPointsPerGame: "0.0",
      playoffTeams: [],
      totalGames: 0,
      overtimeGames: 0,
    };
  }

  // Separate regular season and playoff games
  const regularSeasonGames = seasonGames.filter((g) => !g.isPlayoff);
  const playoffGames = seasonGames.filter((g) => g.isPlayoff);

  // Track team records
  const teamRecordsMap = new Map<string, { wins: number; losses: number }>();

  // Process regular season for team records
  for (const game of regularSeasonGames) {
    const homeWon = game.homeScore > game.awayScore;

    if (!teamRecordsMap.has(game.homeTeamName)) {
      teamRecordsMap.set(game.homeTeamName, { wins: 0, losses: 0 });
    }
    if (!teamRecordsMap.has(game.awayTeamName)) {
      teamRecordsMap.set(game.awayTeamName, { wins: 0, losses: 0 });
    }

    if (homeWon) {
      teamRecordsMap.get(game.homeTeamName)!.wins++;
      teamRecordsMap.get(game.awayTeamName)!.losses++;
    } else {
      teamRecordsMap.get(game.homeTeamName)!.losses++;
      teamRecordsMap.get(game.awayTeamName)!.wins++;
    }
  }

  // Find best and worst records
  let bestRecord: TeamRecord = { team: "Unknown", wins: 0, losses: 0 };
  let worstRecord: TeamRecord = { team: "Unknown", wins: 32, losses: 0 };

  for (const [team, record] of teamRecordsMap.entries()) {
    if (record.wins > bestRecord.wins) {
      bestRecord = { team, wins: record.wins, losses: record.losses };
    }
    if (record.wins < worstRecord.wins) {
      worstRecord = { team, wins: record.wins, losses: record.losses };
    }
  }

  // Find champion (last playoff game winner)
  let champion = "Unknown";
  if (playoffGames.length > 0) {
    const lastPlayoffGame = playoffGames[playoffGames.length - 1];
    champion =
      lastPlayoffGame.homeScore > lastPlayoffGame.awayScore
        ? lastPlayoffGame.homeTeamName
        : lastPlayoffGame.awayTeamName;
  }

  // Find highest scoring game
  let highestScoringGame: GameHighlight = {
    homeTeam: "Unknown",
    awayTeam: "Unknown",
    homeScore: 0,
    awayScore: 0,
    total: 0,
  };
  for (const game of seasonGames) {
    const total = game.homeScore + game.awayScore;
    if (total > highestScoringGame.total) {
      highestScoringGame = {
        homeTeam: game.homeTeamName,
        awayTeam: game.awayTeamName,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        total,
      };
    }
  }

  // Calculate average points per game
  let totalPoints = 0;
  for (const game of seasonGames) {
    totalPoints += game.homeScore + game.awayScore;
  }
  const avgPointsPerGame =
    seasonGames.length > 0
      ? (totalPoints / (seasonGames.length * 2)).toFixed(1)
      : "0.0";

  // Find playoff teams (appeared in playoff games)
  const playoffTeamsSet = new Set<string>();
  for (const game of playoffGames) {
    playoffTeamsSet.add(game.homeTeamName);
    playoffTeamsSet.add(game.awayTeamName);
  }
  const playoffTeams = Array.from(playoffTeamsSet).sort();

  // Overtime games (can't be reliably detected from score, return 0)
  const overtimeGames = 0;

  return {
    champion,
    bestRecord,
    worstRecord,
    highestScoringGame,
    avgPointsPerGame,
    playoffTeams,
    totalGames: seasonGames.length,
    overtimeGames,
  };
}
