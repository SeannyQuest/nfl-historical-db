/**
 * Pure overtime analysis computation — no DB dependency.
 * Analyzes overtime game patterns, trends, and outcomes.
 */

export interface OTGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isOvertime: boolean;
  isPlayoff: boolean;
}

export interface TeamOTRecord {
  team: string;
  otWins: number;
  otLosses: number;
  otWinPct: number;
}

export interface SeasonOTTrend {
  season: number;
  otGames: number;
  otPct: number;
}

export interface PlayoffOTStats {
  games: number;
  homeWinPct: number;
}

export interface OvertimeAnalysisResult {
  totalOTGames: number;
  otPct: number;
  homeWinPctInOT: number;
  avgOTScore: number;
  teamOTRecords: TeamOTRecord[];
  seasonOTTrends: SeasonOTTrend[];
  playoffOT: PlayoffOTStats;
}

export function computeOvertimeAnalysis(
  games: OTGame[]
): OvertimeAnalysisResult {
  if (games.length === 0) {
    return {
      totalOTGames: 0,
      otPct: 0,
      homeWinPctInOT: 0,
      avgOTScore: 0,
      teamOTRecords: [],
      seasonOTTrends: [],
      playoffOT: { games: 0, homeWinPct: 0 },
    };
  }

  const otGames = games.filter((g) => g.isOvertime);
  const totalOTGames = otGames.length;
  const otPct =
    games.length > 0
      ? Math.round((totalOTGames / games.length) * 10000) / 10000
      : 0;

  // Home win % in OT
  let homeOTWins = 0;
  let totalOTScore = 0;

  for (const g of otGames) {
    if (g.homeScore > g.awayScore) {
      homeOTWins++;
    }
    totalOTScore += g.homeScore + g.awayScore;
  }

  const homeWinPctInOT =
    totalOTGames > 0
      ? Math.round((homeOTWins / totalOTGames) * 10000) / 10000
      : 0;
  const avgOTScore =
    totalOTGames > 0
      ? Math.round((totalOTScore / totalOTGames) * 100) / 100
      : 0;

  // Team OT records
  const teamMap = new Map<
    string,
    { otWins: number; otLosses: number }
  >();

  for (const g of otGames) {
    const homeWon = g.homeScore > g.awayScore;

    if (!teamMap.has(g.homeTeamName)) {
      teamMap.set(g.homeTeamName, { otWins: 0, otLosses: 0 });
    }
    if (!teamMap.has(g.awayTeamName)) {
      teamMap.set(g.awayTeamName, { otWins: 0, otLosses: 0 });
    }

    const homeRec = teamMap.get(g.homeTeamName)!;
    const awayRec = teamMap.get(g.awayTeamName)!;

    if (homeWon) {
      homeRec.otWins++;
      awayRec.otLosses++;
    } else {
      homeRec.otLosses++;
      awayRec.otWins++;
    }
  }

  const teamOTRecords: TeamOTRecord[] = Array.from(teamMap.entries())
    .map(([team, data]) => {
      const total = data.otWins + data.otLosses;
      return {
        team,
        otWins: data.otWins,
        otLosses: data.otLosses,
        otWinPct:
          total > 0
            ? Math.round((data.otWins / total) * 10000) / 10000
            : 0,
      };
    })
    .sort((a, b) => b.otWinPct - a.otWinPct);

  // Season OT trends
  const seasonMap = new Map<
    number,
    { otCount: number; totalCount: number }
  >();

  for (const g of games) {
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { otCount: 0, totalCount: 0 });
    }
    const s = seasonMap.get(g.season)!;
    s.totalCount++;
    if (g.isOvertime) {
      s.otCount++;
    }
  }

  const seasonOTTrends: SeasonOTTrend[] = Array.from(seasonMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      otGames: data.otCount,
      otPct:
        data.totalCount > 0
          ? Math.round((data.otCount / data.totalCount) * 10000) / 10000
          : 0,
    }));

  // Playoff OT stats
  const playoffOTGames = otGames.filter((g) => g.isPlayoff);
  let playoffHomeOTWins = 0;

  for (const g of playoffOTGames) {
    if (g.homeScore > g.awayScore) {
      playoffHomeOTWins++;
    }
  }

  const playoffOT: PlayoffOTStats = {
    games: playoffOTGames.length,
    homeWinPct:
      playoffOTGames.length > 0
        ? Math.round((playoffHomeOTWins / playoffOTGames.length) * 10000) /
          10000
        : 0,
  };

  return {
    totalOTGames,
    otPct,
    homeWinPctInOT,
    avgOTScore,
    teamOTRecords,
    seasonOTTrends,
    playoffOT,
  };
}
