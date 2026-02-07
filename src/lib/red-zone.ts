/**
 * Pure red zone efficiency analysis — no DB dependency.
 */

export interface RedZoneGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTouchdowns: number;
  awayTouchdowns: number;
  homeFieldGoals: number;
  awayFieldGoals: number;
}

export interface TeamRedZoneStat {
  team: string;
  touchdowns: number;
  fieldGoals: number;
  totalDrives: number;
  tdRate: number;
  avgPointsPerDrive: number;
}

export interface SeasonTrend {
  season: number;
  avgTdRate: number;
  avgFgRate: number;
}

export interface RedZoneResult {
  teamStats: TeamRedZoneStat[];
  leagueAvgTdRate: number;
  topRedZoneTeams: TeamRedZoneStat[];
  bottomRedZoneTeams: TeamRedZoneStat[];
  seasonTrends: SeasonTrend[];
}

export function computeRedZoneEfficiency(games: RedZoneGame[]): RedZoneResult {
  if (games.length === 0) {
    return {
      teamStats: [],
      leagueAvgTdRate: 0,
      topRedZoneTeams: [],
      bottomRedZoneTeams: [],
      seasonTrends: [],
    };
  }

  const teamMap = new Map<
    string,
    { touchdowns: number; fieldGoals: number; points: number }
  >();

  for (const g of games) {
    const homeEntry = teamMap.get(g.homeTeamName) || {
      touchdowns: 0,
      fieldGoals: 0,
      points: 0,
    };
    const awayEntry = teamMap.get(g.awayTeamName) || {
      touchdowns: 0,
      fieldGoals: 0,
      points: 0,
    };

    homeEntry.touchdowns += g.homeTouchdowns;
    homeEntry.fieldGoals += g.homeFieldGoals;
    homeEntry.points += g.homeTouchdowns * 6 + g.homeFieldGoals * 3;

    awayEntry.touchdowns += g.awayTouchdowns;
    awayEntry.fieldGoals += g.awayFieldGoals;
    awayEntry.points += g.awayTouchdowns * 6 + g.awayFieldGoals * 3;

    teamMap.set(g.homeTeamName, homeEntry);
    teamMap.set(g.awayTeamName, awayEntry);
  }

  const teamStats: TeamRedZoneStat[] = [...teamMap.entries()]
    .map(([team, stats]) => {
      const totalDrives = stats.touchdowns + stats.fieldGoals;
      const tdRate = totalDrives > 0 ? stats.touchdowns / totalDrives : 0;
      const avgPointsPerDrive =
        totalDrives > 0 ? stats.points / totalDrives : 0;
      return {
        team,
        touchdowns: stats.touchdowns,
        fieldGoals: stats.fieldGoals,
        totalDrives,
        tdRate: parseFloat(tdRate.toFixed(3)),
        avgPointsPerDrive: parseFloat(avgPointsPerDrive.toFixed(2)),
      };
    })
    .sort((a, b) => b.tdRate - a.tdRate);

  const leagueAvgTdRate =
    teamStats.length > 0
      ? parseFloat(
          (teamStats.reduce((sum, t) => sum + t.tdRate, 0) / teamStats.length).toFixed(3)
        )
      : 0;

  const topRedZoneTeams = teamStats.slice(0, 10);
  const bottomRedZoneTeams = teamStats.slice(-10).reverse();

  // Compute season trends
  const seasonMap = new Map<
    number,
    { totalTdRate: number; totalFgRate: number; teamCount: number }
  >();

  for (const g of games) {
    const season = g.season;
    if (!seasonMap.has(season)) {
      seasonMap.set(season, { totalTdRate: 0, totalFgRate: 0, teamCount: 0 });
    }
    const entry = seasonMap.get(season)!;

    const homeTotalDrives = g.homeTouchdowns + g.homeFieldGoals;
    const awayTotalDrives = g.awayTouchdowns + g.awayFieldGoals;

    if (homeTotalDrives > 0) {
      entry.totalTdRate += g.homeTouchdowns / homeTotalDrives;
      entry.teamCount++;
    }
    if (awayTotalDrives > 0) {
      entry.totalTdRate += g.awayTouchdowns / awayTotalDrives;
      entry.teamCount++;
    }

    if (homeTotalDrives > 0) {
      entry.totalFgRate += g.homeFieldGoals / homeTotalDrives;
    }
    if (awayTotalDrives > 0) {
      entry.totalFgRate += g.awayFieldGoals / awayTotalDrives;
    }
  }

  const seasonTrends: SeasonTrend[] = [...seasonMap.entries()]
    .map(([season, data]) => {
      const avgTeamCount = data.teamCount > 0 ? data.teamCount : 1;
      return {
        season,
        avgTdRate: parseFloat((data.totalTdRate / avgTeamCount).toFixed(3)),
        avgFgRate: parseFloat((data.totalFgRate / avgTeamCount).toFixed(3)),
      };
    })
    .sort((a, b) => a.season - b.season);

  return {
    teamStats,
    leagueAvgTdRate,
    topRedZoneTeams,
    bottomRedZoneTeams,
    seasonTrends,
  };
}
