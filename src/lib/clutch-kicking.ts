/**
 * Pure clutch kicking proxy analysis — no DB dependency.
 * Analyzes performance in close games (field goal range, ±3 points).
 */

export interface ClutchGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface FieldGoalRangeStats {
  count: number;
  pctOfAll: number;
  homeWinPct: number;
}

export interface TeamClutchRecord {
  team: string;
  fgRangeWins: number;
  fgRangeLosses: number;
  fgRangeWinPct: number;
  totalCloseGames: number;
}

export interface SeasonClutchTrend {
  season: number;
  fgRangeGamePct: number;
}

export interface ClutchKickingResult {
  fieldGoalRangeGames: FieldGoalRangeStats;
  teamClutchRecords: TeamClutchRecord[];
  bestClutchTeams: TeamClutchRecord[];
  worstClutchTeams: TeamClutchRecord[];
  seasonTrends: SeasonClutchTrend[];
}

export function computeClutchKicking(
  games: ClutchGame[]
): ClutchKickingResult {
  if (games.length === 0) {
    return {
      fieldGoalRangeGames: { count: 0, pctOfAll: 0, homeWinPct: 0 },
      teamClutchRecords: [],
      bestClutchTeams: [],
      worstClutchTeams: [],
      seasonTrends: [],
    };
  }

  // Filter to close games (within 3 points)
  const closeGames = games.filter((g) => {
    const margin = Math.abs(g.homeScore - g.awayScore);
    return margin <= 3;
  });

  const count = closeGames.length;
  const pctOfAll =
    games.length > 0
      ? Math.round((count / games.length) * 10000) / 10000
      : 0;

  // Home win % in close games
  let homeCloseWins = 0;
  for (const g of closeGames) {
    if (g.homeScore > g.awayScore) {
      homeCloseWins++;
    }
  }

  const homeWinPct =
    count > 0 ? Math.round((homeCloseWins / count) * 10000) / 10000 : 0;

  // Team clutch records
  const teamMap = new Map<
    string,
    { wins: number; losses: number }
  >();

  for (const g of closeGames) {
    if (!teamMap.has(g.homeTeamName)) {
      teamMap.set(g.homeTeamName, { wins: 0, losses: 0 });
    }
    if (!teamMap.has(g.awayTeamName)) {
      teamMap.set(g.awayTeamName, { wins: 0, losses: 0 });
    }

    const homeWon = g.homeScore > g.awayScore;
    const homeRec = teamMap.get(g.homeTeamName)!;
    const awayRec = teamMap.get(g.awayTeamName)!;

    if (homeWon) {
      homeRec.wins++;
      awayRec.losses++;
    } else {
      homeRec.losses++;
      awayRec.wins++;
    }
  }

  const teamClutchRecords: TeamClutchRecord[] = Array.from(teamMap.entries())
    .map(([team, data]) => {
      const total = data.wins + data.losses;
      return {
        team,
        fgRangeWins: data.wins,
        fgRangeLosses: data.losses,
        fgRangeWinPct:
          total > 0
            ? Math.round((data.wins / total) * 10000) / 10000
            : 0,
        totalCloseGames: total,
      };
    })
    .sort((a, b) => b.fgRangeWinPct - a.fgRangeWinPct);

  // Best clutch teams (min 3 close games)
  const bestClutchTeams = teamClutchRecords
    .filter((t) => t.totalCloseGames >= 3)
    .slice(0, 10);

  // Worst clutch teams (min 3 close games)
  const worstClutchTeams = teamClutchRecords
    .filter((t) => t.totalCloseGames >= 3)
    .slice(-10)
    .reverse();

  // Season trends
  const seasonMap = new Map<
    number,
    { closeCount: number; totalCount: number }
  >();

  for (const g of games) {
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { closeCount: 0, totalCount: 0 });
    }
    const s = seasonMap.get(g.season)!;
    s.totalCount++;

    const margin = Math.abs(g.homeScore - g.awayScore);
    if (margin <= 3) {
      s.closeCount++;
    }
  }

  const seasonTrends: SeasonClutchTrend[] = Array.from(seasonMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      fgRangeGamePct:
        data.totalCount > 0
          ? Math.round((data.closeCount / data.totalCount) * 10000) / 10000
          : 0,
    }));

  return {
    fieldGoalRangeGames: { count, pctOfAll, homeWinPct },
    teamClutchRecords,
    bestClutchTeams,
    worstClutchTeams,
    seasonTrends,
  };
}
