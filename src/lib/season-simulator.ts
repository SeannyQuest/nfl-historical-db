/**
 * Pure season simulator — no DB dependency.
 */

export interface SimGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface SimTeam {
  name: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface ProjectedStanding {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: string;
  pointDifferential: number;
}

export interface ProjectedStandings {
  season: number;
  standings: ProjectedStanding[];
}

export interface SeasonSimulatorResult {
  stats: ProjectedStandings;
}

export function simulateSeason(games: SimGame[], teams: string[], targetSeason: number): SeasonSimulatorResult {
  const seasonGames = games.filter((g) => g.season === targetSeason);

  if (seasonGames.length === 0) {
    return {
      stats: {
        season: targetSeason,
        standings: [],
      },
    };
  }

  // Build team stats
  const teamStats = new Map<string, SimTeam>();

  for (const team of teams) {
    teamStats.set(team, {
      name: team,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const g of seasonGames) {
    const homeTeam = teamStats.get(g.homeTeamName);
    const awayTeam = teamStats.get(g.awayTeamName);

    if (!homeTeam || !awayTeam) continue;

    homeTeam.pointsFor += g.homeScore;
    homeTeam.pointsAgainst += g.awayScore;
    awayTeam.pointsFor += g.awayScore;
    awayTeam.pointsAgainst += g.homeScore;

    if (g.homeScore > g.awayScore) {
      homeTeam.wins++;
      awayTeam.losses++;
    } else if (g.awayScore > g.homeScore) {
      awayTeam.wins++;
      homeTeam.losses++;
    } else {
      homeTeam.ties++;
      awayTeam.ties++;
    }
  }

  const standings: ProjectedStanding[] = [...teamStats.values()]
    .map((team) => {
      const gamesPlayed = team.wins + team.losses + team.ties;
      const winPct = gamesPlayed > 0 ? (team.wins / gamesPlayed).toFixed(3) : ".000";
      return {
        rank: 0,
        team: team.name,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        winPct,
        pointDifferential: team.pointsFor - team.pointsAgainst,
      };
    })
    .sort((a, b) => {
      const winDiff = parseFloat(b.winPct) - parseFloat(a.winPct);
      if (winDiff !== 0) return winDiff;
      return b.pointDifferential - a.pointDifferential;
    })
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  return {
    stats: {
      season: targetSeason,
      standings,
    },
  };
}
