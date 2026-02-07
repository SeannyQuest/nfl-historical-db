/**
 * Pure garbage time analysis — no DB dependency.
 */

export interface GarbageTimeGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  fourthQuarterHomePts: number;
  fourthQuarterAwayPts: number;
  halftimeHomeScore: number;
  halftimeAwayScore: number;
  spread: number | null;
  spreadResult: string | null;
}

export interface TeamGarbageTimeStat {
  team: string;
  gamesWithGarbageTime: number;
  garbageTimePtsScored: number;
  garbageTimePtsAllowed: number;
}

export interface GarbageTimeImpactOnATS {
  garbageTimeCovers: number;
  garbageTimeNonCovers: number;
  coverRate: number;
}

export interface GarbageTimeSeasonTrend {
  season: number;
  garbageTimePct: number;
}

export interface GarbageTimeResult {
  garbageTimeGames: number;
  garbageTimePercentage: number;
  teamStats: TeamGarbageTimeStat[];
  impactOnATS: GarbageTimeImpactOnATS;
  seasonTrends: GarbageTimeSeasonTrend[];
}

export function computeGarbageTimeAnalysis(
  games: GarbageTimeGame[]
): GarbageTimeResult {
  if (games.length === 0) {
    return {
      garbageTimeGames: 0,
      garbageTimePercentage: 0,
      teamStats: [],
      impactOnATS: { garbageTimeCovers: 0, garbageTimeNonCovers: 0, coverRate: 0 },
      seasonTrends: [],
    };
  }

  let garbageTimeCount = 0;
  const teamMap = new Map<
    string,
    { garbageTimePtsScored: number; garbageTimePtsAllowed: number; count: number }
  >();
  let atsCovers = 0;
  let atsNonCovers = 0;

  // Season tracking for garbage time percentage
  const seasonMap = new Map<number, { garbageTime: number; total: number }>();

  for (const g of games) {
    const halftimeDiff = Math.abs(g.halftimeHomeScore - g.halftimeAwayScore);
    const finalDiff = Math.abs(g.homeScore - g.awayScore);

    // Garbage time: margin at halftime >= 21 AND losing team scored more in Q4
    const isLosingTeam =
      g.halftimeHomeScore < g.halftimeAwayScore
        ? "home"
        : g.halftimeHomeScore > g.halftimeAwayScore
          ? "away"
          : null;

    const hasGarbageTime =
      halftimeDiff >= 21 &&
      ((isLosingTeam === "home" && g.fourthQuarterHomePts > g.fourthQuarterAwayPts) ||
        (isLosingTeam === "away" &&
          g.fourthQuarterAwayPts > g.fourthQuarterHomePts));

    if (hasGarbageTime) {
      garbageTimeCount++;

      // Track teams involved in garbage time
      const homeEntry = teamMap.get(g.homeTeamName) || {
        garbageTimePtsScored: 0,
        garbageTimePtsAllowed: 0,
        count: 0,
      };
      const awayEntry = teamMap.get(g.awayTeamName) || {
        garbageTimePtsScored: 0,
        garbageTimePtsAllowed: 0,
        count: 0,
      };

      if (isLosingTeam === "home") {
        homeEntry.garbageTimePtsScored += g.fourthQuarterHomePts;
        homeEntry.garbageTimePtsAllowed += g.fourthQuarterAwayPts;
        awayEntry.garbageTimePtsScored += g.fourthQuarterAwayPts;
        awayEntry.garbageTimePtsAllowed += g.fourthQuarterHomePts;
      } else if (isLosingTeam === "away") {
        awayEntry.garbageTimePtsScored += g.fourthQuarterAwayPts;
        awayEntry.garbageTimePtsAllowed += g.fourthQuarterHomePts;
        homeEntry.garbageTimePtsScored += g.fourthQuarterHomePts;
        homeEntry.garbageTimePtsAllowed += g.fourthQuarterAwayPts;
      }

      homeEntry.count++;
      awayEntry.count++;

      teamMap.set(g.homeTeamName, homeEntry);
      teamMap.set(g.awayTeamName, awayEntry);

      // Track ATS impact
      if (g.spread !== null && g.spreadResult !== null) {
        if (g.spreadResult === "COVERED") {
          atsCovers++;
        } else {
          atsNonCovers++;
        }
      }
    }

    // Season tracking
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { garbageTime: 0, total: 0 });
    }
    const seasonEntry = seasonMap.get(g.season)!;
    seasonEntry.total++;
    if (hasGarbageTime) {
      seasonEntry.garbageTime++;
    }
  }

  const garbageTimePercentage =
    games.length > 0
      ? parseFloat(((garbageTimeCount / games.length) * 100).toFixed(1))
      : 0;

  const teamStats: TeamGarbageTimeStat[] = [...teamMap.entries()]
    .map(([team, stats]) => ({
      team,
      gamesWithGarbageTime: stats.count,
      garbageTimePtsScored: stats.garbageTimePtsScored,
      garbageTimePtsAllowed: stats.garbageTimePtsAllowed,
    }))
    .sort((a, b) => b.garbageTimePtsScored - a.garbageTimePtsScored);

  const totalATSBets = atsCovers + atsNonCovers;
  const atsCoversRate =
    totalATSBets > 0
      ? parseFloat((atsCovers / totalATSBets).toFixed(3))
      : 0;

  const seasonTrends: GarbageTimeSeasonTrend[] = [...seasonMap.entries()]
    .map(([season, data]) => ({
      season,
      garbageTimePct: parseFloat(
        ((data.garbageTime / data.total) * 100).toFixed(1)
      ),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    garbageTimeGames: garbageTimeCount,
    garbageTimePercentage,
    teamStats,
    impactOnATS: {
      garbageTimeCovers: atsCovers,
      garbageTimeNonCovers: atsNonCovers,
      coverRate: atsCoversRate,
    },
    seasonTrends,
  };
}
