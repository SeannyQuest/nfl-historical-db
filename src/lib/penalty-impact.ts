/**
 * Pure penalty impact computation — no DB dependency.
 * Operates on arrays of game-like objects to compute penalty analytics.
 */

export interface PenaltyGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homePenalties: number;
  awayPenalties: number;
  homePenaltyYards: number;
  awayPenaltyYards: number;
}

export interface TeamPenaltyStats {
  team: string;
  gamesPlayed: number;
  totalPenalties: number;
  penaltiesPerGame: number;
  totalPenaltyYards: number;
  yardsPerGame: number;
  winPctWhenFewerPenalties: string;
  winPctWhenMorePenalties: string;
}

export interface DisciplineWinCorrelation {
  fewerPenaltiesWinPct: string;
  morePenaltiesWinPct: string;
  equalPenaltiesHomePct: string;
}

export interface SeasonPenaltyTrend {
  season: number;
  avgPenaltiesPerGame: string;
  avgYardsPerGame: string;
}

export interface PenaltyResult {
  teamStats: TeamPenaltyStats[];
  mostPenalized: TeamPenaltyStats[];
  leastPenalized: TeamPenaltyStats[];
  disciplineWinCorrelation: DisciplineWinCorrelation;
  seasonTrends: SeasonPenaltyTrend[];
}

export function computePenaltyImpact(games: PenaltyGame[]): PenaltyResult {
  // Build team penalty stats
  const teamStatsMap = new Map<
    string,
    {
      gamesPlayed: number;
      totalPenalties: number;
      totalYards: number;
      winsWhenFewerPenalties: number;
      gamesWhenFewerPenalties: number;
      winsWhenMorePenalties: number;
      gamesWhenMorePenalties: number;
    }
  >();

  // League-wide stats
  let fewerPenaltiesWins = 0;
  let fewerPenaltiesTotals = 0;
  let morePenaltiesWins = 0;
  let morePenaltiesTotals = 0;
  let equalPenaltiesHomeWins = 0;
  let equalPenaltiesTotals = 0;

  const seasonMap = new Map<
    number,
    { penalties: number[]; yards: number[]; gameCount: number }
  >();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (!homeWon && !awayWon) continue; // Skip ties

    // Initialize team stats if needed
    if (!teamStatsMap.has(g.homeTeamName)) {
      teamStatsMap.set(g.homeTeamName, {
        gamesPlayed: 0,
        totalPenalties: 0,
        totalYards: 0,
        winsWhenFewerPenalties: 0,
        gamesWhenFewerPenalties: 0,
        winsWhenMorePenalties: 0,
        gamesWhenMorePenalties: 0,
      });
    }
    if (!teamStatsMap.has(g.awayTeamName)) {
      teamStatsMap.set(g.awayTeamName, {
        gamesPlayed: 0,
        totalPenalties: 0,
        totalYards: 0,
        winsWhenFewerPenalties: 0,
        gamesWhenFewerPenalties: 0,
        winsWhenMorePenalties: 0,
        gamesWhenMorePenalties: 0,
      });
    }

    // Home team stats
    const homeStats = teamStatsMap.get(g.homeTeamName)!;
    homeStats.gamesPlayed++;
    homeStats.totalPenalties += g.homePenalties;
    homeStats.totalYards += g.homePenaltyYards;

    if (g.homePenalties < g.awayPenalties) {
      homeStats.gamesWhenFewerPenalties++;
      if (homeWon) homeStats.winsWhenFewerPenalties++;
    } else if (g.homePenalties > g.awayPenalties) {
      homeStats.gamesWhenMorePenalties++;
      if (homeWon) homeStats.winsWhenMorePenalties++;
    }

    // Away team stats
    const awayStats = teamStatsMap.get(g.awayTeamName)!;
    awayStats.gamesPlayed++;
    awayStats.totalPenalties += g.awayPenalties;
    awayStats.totalYards += g.awayPenaltyYards;

    if (g.awayPenalties < g.homePenalties) {
      awayStats.gamesWhenFewerPenalties++;
      if (awayWon) awayStats.winsWhenFewerPenalties++;
    } else if (g.awayPenalties > g.homePenalties) {
      awayStats.gamesWhenMorePenalties++;
      if (awayWon) awayStats.winsWhenMorePenalties++;
    }

    // League-wide correlation
    if (g.homePenalties < g.awayPenalties) {
      fewerPenaltiesTotals++;
      if (homeWon) fewerPenaltiesWins++;
    } else if (g.homePenalties > g.awayPenalties) {
      morePenaltiesTotals++;
      if (homeWon) morePenaltiesWins++;
    } else {
      // Equal penalties
      equalPenaltiesTotals++;
      if (homeWon) equalPenaltiesHomeWins++;
    }

    // Season trends
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { penalties: [], yards: [], gameCount: 0 });
    }
    const seasonStats = seasonMap.get(g.season)!;
    seasonStats.penalties.push(g.homePenalties, g.awayPenalties);
    seasonStats.yards.push(g.homePenaltyYards, g.awayPenaltyYards);
    seasonStats.gameCount++;
  }

  // Convert team stats
  const teamStats: TeamPenaltyStats[] = Array.from(teamStatsMap.entries())
    .map(([team, stats]) => ({
      team,
      gamesPlayed: stats.gamesPlayed,
      totalPenalties: stats.totalPenalties,
      penaltiesPerGame: parseFloat(
        (stats.totalPenalties / stats.gamesPlayed).toFixed(2)
      ),
      totalPenaltyYards: stats.totalYards,
      yardsPerGame: parseFloat(
        (stats.totalYards / stats.gamesPlayed).toFixed(2)
      ),
      winPctWhenFewerPenalties:
        stats.gamesWhenFewerPenalties > 0
          ? (stats.winsWhenFewerPenalties / stats.gamesWhenFewerPenalties).toFixed(3)
          : ".000",
      winPctWhenMorePenalties:
        stats.gamesWhenMorePenalties > 0
          ? (stats.winsWhenMorePenalties / stats.gamesWhenMorePenalties).toFixed(3)
          : ".000",
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Most and least penalized
  const mostPenalized = [...teamStats]
    .sort((a, b) => b.penaltiesPerGame - a.penaltiesPerGame)
    .slice(0, 10);

  const leastPenalized = [...teamStats]
    .sort((a, b) => a.penaltiesPerGame - b.penaltiesPerGame)
    .slice(0, 10);

  // Discipline win correlation
  const disciplineWinCorrelation: DisciplineWinCorrelation = {
    fewerPenaltiesWinPct:
      fewerPenaltiesTotals > 0
        ? (fewerPenaltiesWins / fewerPenaltiesTotals).toFixed(3)
        : ".000",
    morePenaltiesWinPct:
      morePenaltiesTotals > 0
        ? (morePenaltiesWins / morePenaltiesTotals).toFixed(3)
        : ".000",
    equalPenaltiesHomePct:
      equalPenaltiesTotals > 0
        ? (equalPenaltiesHomeWins / equalPenaltiesTotals).toFixed(3)
        : ".500",
  };

  // Season trends
  const seasonTrends: SeasonPenaltyTrend[] = Array.from(seasonMap.entries())
    .map(([season, stats]) => ({
      season,
      avgPenaltiesPerGame: (
        stats.penalties.reduce((a, b) => a + b, 0) / stats.gameCount / 2
      ).toFixed(2),
      avgYardsPerGame: (
        stats.yards.reduce((a, b) => a + b, 0) / stats.gameCount / 2
      ).toFixed(2),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamStats,
    mostPenalized,
    leastPenalized,
    disciplineWinCorrelation,
    seasonTrends,
  };
}
