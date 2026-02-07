/**
 * Pure schedule strength analysis — no DB dependency.
 * Computes strength of schedule based on opponent win rates.
 */

export interface SOSGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface TeamSOS {
  team: string;
  season: number;
  gamesPlayed: number;
  gamesRemaining: number;
  pastSOS: string;
  futureSOS: string;
  combinedSOS: string;
}

export interface ScheduleStrengthStats {
  season: number;
  totalTeams: number;
  teams: TeamSOS[];
  easiestSchedules: TeamSOS[];
  hardestSchedules: TeamSOS[];
}

export interface ScheduleStrengthResult {
  stats: ScheduleStrengthStats;
}

export function computeScheduleStrength(games: SOSGame[], season?: number): ScheduleStrengthResult {
  if (games.length === 0) {
    return {
      stats: {
        season: season ?? 2024,
        totalTeams: 0,
        teams: [],
        easiestSchedules: [],
        hardestSchedules: [],
      },
    };
  }

  const targetSeason = season ?? (games.length > 0 ? games[0].season : 2024);
  const seasonGames = games.filter((g) => g.season === targetSeason);

  // Build win records for all teams
  const teamWins = new Map<string, { wins: number; games: number }>();
  const allTeams = new Set<string>();

  for (const game of games) {
    allTeams.add(game.homeTeamName);
    allTeams.add(game.awayTeamName);

    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;

    const homeEntry = teamWins.get(game.homeTeamName) || { wins: 0, games: 0 };
    homeEntry.games++;
    if (homeWon) homeEntry.wins++;
    teamWins.set(game.homeTeamName, homeEntry);

    const awayEntry = teamWins.get(game.awayTeamName) || { wins: 0, games: 0 };
    awayEntry.games++;
    if (awayWon) awayEntry.wins++;
    teamWins.set(game.awayTeamName, awayEntry);
  }

  // Early return if no season games
  if (seasonGames.length === 0 || allTeams.size === 0) {
    return {
      stats: {
        season: targetSeason,
        totalTeams: allTeams.size,
        teams: [],
        easiestSchedules: [],
        hardestSchedules: [],
      },
    };
  }

  // Compute SOS for each team in target season
  const teamSOSMap = new Map<string, TeamSOS>();

  for (const team of allTeams) {
    const teamSeasonGames = seasonGames.filter(
      (g) => g.homeTeamName === team || g.awayTeamName === team
    );

    let pastSOSTotal = 0;
    let pastOppCount = 0;
    let futureSOSTotal = 0;
    let futureOppCount = 0;
    let gameIndex = 0;

    for (let i = 0; i < teamSeasonGames.length; i++) {
      const game = teamSeasonGames[i];
      const opponent =
        game.homeTeamName === team ? game.awayTeamName : game.homeTeamName;
      const oppWinRecord = teamWins.get(opponent);

      if (oppWinRecord && oppWinRecord.games > 0) {
        const oppWinRate = oppWinRecord.wins / oppWinRecord.games;

        // Games played (past)
        if (
          (game.homeTeamName === team && game.homeScore !== 0) ||
          (game.awayTeamName === team && game.awayScore !== 0)
        ) {
          pastSOSTotal += oppWinRate;
          pastOppCount++;
          gameIndex = i + 1;
        } else {
          // Games remaining (future)
          futureSOSTotal += oppWinRate;
          futureOppCount++;
        }
      }
    }

    const pastSOS =
      pastOppCount > 0
        ? (pastSOSTotal / pastOppCount).toFixed(3)
        : ".500";
    const futureSOS =
      futureOppCount > 0
        ? (futureSOSTotal / futureOppCount).toFixed(3)
        : ".500";

    // Combined SOS
    const combinedOppCount = pastOppCount + futureOppCount;
    const combinedSOS =
      combinedOppCount > 0
        ? ((pastSOSTotal + futureSOSTotal) / combinedOppCount).toFixed(3)
        : ".500";

    teamSOSMap.set(team, {
      team,
      season: targetSeason,
      gamesPlayed: gameIndex,
      gamesRemaining: Math.max(0, teamSeasonGames.length - gameIndex),
      pastSOS,
      futureSOS,
      combinedSOS,
    });
  }

  const teams = [...teamSOSMap.values()].sort(
    (a, b) => parseFloat(b.combinedSOS) - parseFloat(a.combinedSOS)
  );

  const hardestSchedules = teams.slice(0, 10);
  const easiestSchedules = teams.slice(-10).reverse();

  return {
    stats: {
      season: targetSeason,
      totalTeams: teamSOSMap.size,
      teams,
      easiestSchedules,
      hardestSchedules,
    },
  };
}
