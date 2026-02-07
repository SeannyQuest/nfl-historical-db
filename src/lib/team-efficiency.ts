/**
 * Pure team efficiency computation — no DB dependency.
 * Operates on arrays of game-like objects to compute efficiency metrics.
 */

export interface EfficiencyGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTotalYards: number;
  awayTotalYards: number;
  homeFirstDowns: number;
  awayFirstDowns: number;
  homePlays: number;
  awayPlays: number;
  homeTimeOfPossession: number;
  awayTimeOfPossession: number;
}

export interface TeamEfficiencyStats {
  team: string;
  gamesPlayed: number;
  pointsPerGame: string;
  yardsPerGame: string;
  yardsPerPlay: string;
  firstDownsPerGame: string;
  playsPerGame: string;
  avgTimeOfPossession: string;
  pointsPerYard: string;
}

export interface PossessionCorrelation {
  morePossessionWinPct: string;
  lessPossessionWinPct: string;
}

export interface SeasonEfficiencyTrend {
  season: number;
  leagueAvgYardsPerPlay: string;
  leagueAvgPtsPerGame: string;
}

export interface EfficiencyResult {
  teamStats: TeamEfficiencyStats[];
  mostEfficient: TeamEfficiencyStats[];
  leastEfficient: TeamEfficiencyStats[];
  possessionCorrelation: PossessionCorrelation;
  seasonTrends: SeasonEfficiencyTrend[];
}

export function computeTeamEfficiency(games: EfficiencyGame[]): EfficiencyResult {
  // Build team stats
  const teamStatsMap = new Map<
    string,
    {
      gamesPlayed: number;
      totalPoints: number;
      totalYards: number;
      totalFirstDowns: number;
      totalPlays: number;
      totalTimeOfPossession: number;
      winsWhenMorePossession: number;
      gamesWhenMorePossession: number;
      winsWhenLessPossession: number;
      gamesWhenLessPossession: number;
    }
  >();

  // League stats
  const seasonMap = new Map<
    number,
    {
      yardsPerPlay: number[];
      ptsPerGame: number[];
    }
  >();

  let totalPossessionWins = 0;
  let totalPossessionGames = 0;
  let lessPossessionWins = 0;
  let lessPossessionGames = 0;

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (!homeWon && !awayWon) continue; // Skip ties

    // Initialize team stats if needed
    if (!teamStatsMap.has(g.homeTeamName)) {
      teamStatsMap.set(g.homeTeamName, {
        gamesPlayed: 0,
        totalPoints: 0,
        totalYards: 0,
        totalFirstDowns: 0,
        totalPlays: 0,
        totalTimeOfPossession: 0,
        winsWhenMorePossession: 0,
        gamesWhenMorePossession: 0,
        winsWhenLessPossession: 0,
        gamesWhenLessPossession: 0,
      });
    }
    if (!teamStatsMap.has(g.awayTeamName)) {
      teamStatsMap.set(g.awayTeamName, {
        gamesPlayed: 0,
        totalPoints: 0,
        totalYards: 0,
        totalFirstDowns: 0,
        totalPlays: 0,
        totalTimeOfPossession: 0,
        winsWhenMorePossession: 0,
        gamesWhenMorePossession: 0,
        winsWhenLessPossession: 0,
        gamesWhenLessPossession: 0,
      });
    }

    // Home team stats
    const homeStats = teamStatsMap.get(g.homeTeamName)!;
    homeStats.gamesPlayed++;
    homeStats.totalPoints += g.homeScore;
    homeStats.totalYards += g.homeTotalYards;
    homeStats.totalFirstDowns += g.homeFirstDowns;
    homeStats.totalPlays += g.homePlays;
    homeStats.totalTimeOfPossession += g.homeTimeOfPossession;

    if (g.homeTimeOfPossession > g.awayTimeOfPossession) {
      homeStats.gamesWhenMorePossession++;
      if (homeWon) homeStats.winsWhenMorePossession++;
    } else if (g.homeTimeOfPossession < g.awayTimeOfPossession) {
      homeStats.gamesWhenLessPossession++;
      if (homeWon) homeStats.winsWhenLessPossession++;
    }

    // Away team stats
    const awayStats = teamStatsMap.get(g.awayTeamName)!;
    awayStats.gamesPlayed++;
    awayStats.totalPoints += g.awayScore;
    awayStats.totalYards += g.awayTotalYards;
    awayStats.totalFirstDowns += g.awayFirstDowns;
    awayStats.totalPlays += g.awayPlays;
    awayStats.totalTimeOfPossession += g.awayTimeOfPossession;

    if (g.awayTimeOfPossession > g.homeTimeOfPossession) {
      awayStats.gamesWhenMorePossession++;
      if (awayWon) awayStats.winsWhenMorePossession++;
    } else if (g.awayTimeOfPossession < g.homeTimeOfPossession) {
      awayStats.gamesWhenLessPossession++;
      if (awayWon) awayStats.winsWhenLessPossession++;
    }

    // League-wide possession correlation
    if (g.homeTimeOfPossession > g.awayTimeOfPossession) {
      totalPossessionGames++;
      if (homeWon) totalPossessionWins++;
    }
    if (g.awayTimeOfPossession > g.homeTimeOfPossession) {
      lessPossessionGames++;
      if (awayWon) lessPossessionWins++;
    }

    // Season trends
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { yardsPerPlay: [], ptsPerGame: [] });
    }
    const seasonStats = seasonMap.get(g.season)!;
    if (g.homePlays > 0) {
      seasonStats.yardsPerPlay.push(g.homeTotalYards / g.homePlays);
    }
    if (g.awayPlays > 0) {
      seasonStats.yardsPerPlay.push(g.awayTotalYards / g.awayPlays);
    }
    seasonStats.ptsPerGame.push(g.homeScore, g.awayScore);
  }

  // Convert team stats
  const teamStats: TeamEfficiencyStats[] = Array.from(teamStatsMap.entries())
    .map(([team, stats]) => ({
      team,
      gamesPlayed: stats.gamesPlayed,
      pointsPerGame: (stats.totalPoints / stats.gamesPlayed).toFixed(2),
      yardsPerGame: (stats.totalYards / stats.gamesPlayed).toFixed(2),
      yardsPerPlay:
        stats.totalPlays > 0
          ? (stats.totalYards / stats.totalPlays).toFixed(2)
          : "0.00",
      firstDownsPerGame: (stats.totalFirstDowns / stats.gamesPlayed).toFixed(2),
      playsPerGame: (stats.totalPlays / stats.gamesPlayed).toFixed(2),
      avgTimeOfPossession: (stats.totalTimeOfPossession / stats.gamesPlayed).toFixed(2),
      pointsPerYard:
        stats.totalYards > 0
          ? (stats.totalPoints / stats.totalYards).toFixed(3)
          : "0.000",
    }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);

  // Most efficient: top 10 by pointsPerYard
  const mostEfficient = [...teamStats]
    .sort((a, b) => parseFloat(b.pointsPerYard) - parseFloat(a.pointsPerYard))
    .slice(0, 10);

  // Least efficient: bottom 10 by pointsPerYard
  const leastEfficient = [...teamStats]
    .sort((a, b) => parseFloat(a.pointsPerYard) - parseFloat(b.pointsPerYard))
    .slice(0, 10);

  // Possession correlation
  const possessionCorrelation: PossessionCorrelation = {
    morePossessionWinPct:
      totalPossessionGames > 0
        ? (totalPossessionWins / totalPossessionGames).toFixed(3)
        : ".000",
    lessPossessionWinPct:
      lessPossessionGames > 0
        ? (lessPossessionWins / lessPossessionGames).toFixed(3)
        : ".000",
  };

  // Season trends
  const seasonTrends: SeasonEfficiencyTrend[] = Array.from(seasonMap.entries())
    .map(([season, stats]) => ({
      season,
      leagueAvgYardsPerPlay:
        stats.yardsPerPlay.length > 0
          ? (
              stats.yardsPerPlay.reduce((a, b) => a + b, 0) / stats.yardsPerPlay.length
            ).toFixed(2)
          : "0.00",
      leagueAvgPtsPerGame:
        stats.ptsPerGame.length > 0
          ? (
              stats.ptsPerGame.reduce((a, b) => a + b, 0) / stats.ptsPerGame.length
            ).toFixed(2)
          : "0.00",
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamStats,
    mostEfficient,
    leastEfficient,
    possessionCorrelation,
    seasonTrends,
  };
}
