export interface CbbAnalyticsGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeConference: string | null;
  awayConference: string | null;
  isTournament: boolean;
  tournamentRound: string | null;
}

export interface CbbConferenceStats {
  conference: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  avgMargin: string;
}

export interface CbbSeasonSummary {
  season: number;
  totalGames: number;
  avgScore: string;
  topTeams: { team: string; wins: number }[];
  conferenceStats: CbbConferenceStats[];
}

export interface CbbTournamentSummary {
  season: number;
  totalGames: number;
  avgMargin: string;
  biggestUpsets: { team: string; opponent: string; margin: number }[];
}

export function computeCbbSeasonSummary(
  games: CbbAnalyticsGame[]
): CbbSeasonSummary {
  if (games.length === 0) {
    return {
      season: new Date().getFullYear(),
      totalGames: 0,
      avgScore: "0.0",
      topTeams: [],
      conferenceStats: [],
    };
  }

  const season = games[0].season;

  // Calculate team statistics
  const teamStats = new Map<
    string,
    { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
  >();

  games.forEach((game) => {
    // Home team
    if (!teamStats.has(game.homeTeamName)) {
      teamStats.set(game.homeTeamName, {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }
    const homeStats = teamStats.get(game.homeTeamName)!;
    homeStats.pointsFor += game.homeScore;
    homeStats.pointsAgainst += game.awayScore;
    if (game.homeScore > game.awayScore) {
      homeStats.wins += 1;
    } else if (game.homeScore < game.awayScore) {
      homeStats.losses += 1;
    }

    // Away team
    if (!teamStats.has(game.awayTeamName)) {
      teamStats.set(game.awayTeamName, {
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      });
    }
    const awayStats = teamStats.get(game.awayTeamName)!;
    awayStats.pointsFor += game.awayScore;
    awayStats.pointsAgainst += game.homeScore;
    if (game.awayScore > game.homeScore) {
      awayStats.wins += 1;
    } else if (game.awayScore < game.homeScore) {
      awayStats.losses += 1;
    }
  });

  // Top teams by wins
  const topTeams = Array.from(teamStats.entries())
    .sort((a, b) => b[1].wins - a[1].wins)
    .slice(0, 10)
    .map(([team, stats]) => ({
      team,
      wins: stats.wins,
    }));

  // Conference stats
  const conferenceStats = new Map<
    string,
    { wins: number; losses: number; pointsFor: number; pointsAgainst: number }
  >();

  games.forEach((game) => {
    // Home team conference
    if (game.homeConference) {
      if (!conferenceStats.has(game.homeConference)) {
        conferenceStats.set(game.homeConference, {
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        });
      }
      const confStats = conferenceStats.get(game.homeConference)!;
      confStats.pointsFor += game.homeScore;
      confStats.pointsAgainst += game.awayScore;
      if (game.homeScore > game.awayScore) {
        confStats.wins += 1;
      } else if (game.homeScore < game.awayScore) {
        confStats.losses += 1;
      }
    }

    // Away team conference
    if (game.awayConference) {
      if (!conferenceStats.has(game.awayConference)) {
        conferenceStats.set(game.awayConference, {
          wins: 0,
          losses: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        });
      }
      const confStats = conferenceStats.get(game.awayConference)!;
      confStats.pointsFor += game.awayScore;
      confStats.pointsAgainst += game.homeScore;
      if (game.awayScore > game.homeScore) {
        confStats.wins += 1;
      } else if (game.awayScore < game.homeScore) {
        confStats.losses += 1;
      }
    }
  });

  const confStatsArray: CbbConferenceStats[] = Array.from(
    conferenceStats.entries()
  )
    .map(([conf, stats]) => ({
      conference: conf,
      wins: stats.wins,
      losses: stats.losses,
      pointsFor: stats.pointsFor,
      pointsAgainst: stats.pointsAgainst,
      avgMargin: (
        (stats.pointsFor - stats.pointsAgainst) /
        (stats.wins + stats.losses)
      ).toFixed(2),
    }))
    .sort((a, b) => b.wins - a.wins);

  // Calculate average score
  const totalPoints =
    games.reduce((sum, g) => sum + g.homeScore + g.awayScore, 0) /
    games.length;

  return {
    season,
    totalGames: games.length,
    avgScore: totalPoints.toFixed(2),
    topTeams,
    conferenceStats: confStatsArray,
  };
}

export function computeCbbTournamentSummary(
  games: CbbAnalyticsGame[]
): CbbTournamentSummary {
  const tournamentGames = games.filter((g) => g.isTournament);

  if (tournamentGames.length === 0) {
    return {
      season: games.length > 0 ? games[0].season : new Date().getFullYear(),
      totalGames: 0,
      avgMargin: "0.0",
      biggestUpsets: [],
    };
  }

  const season = tournamentGames[0].season;

  // Calculate margins and identify upsets
  const upsets: Array<{ team: string; opponent: string; margin: number }> =
    [];

  tournamentGames.forEach((game) => {
    const margin = Math.abs(game.homeScore - game.awayScore);

    // Simple upset detection: any game with close teams (both in top conferences)
    // If lower seeded team (away) wins with significant margin, it's an upset
    if (game.awayScore > game.homeScore && margin >= 5) {
      upsets.push({
        team: game.awayTeamName,
        opponent: game.homeTeamName,
        margin,
      });
    }
  });

  const biggestUpsets = upsets
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Calculate average margin
  const totalMargin = tournamentGames.reduce(
    (sum, g) => sum + Math.abs(g.homeScore - g.awayScore),
    0
  );
  const avgMargin = (totalMargin / tournamentGames.length).toFixed(2);

  return {
    season,
    totalGames: tournamentGames.length,
    avgMargin,
    biggestUpsets,
  };
}
