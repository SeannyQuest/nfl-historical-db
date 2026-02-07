/**
 * Pure momentum computation — no DB dependency.
 * Operates on arrays of game-like objects to compute momentum analytics.
 */

export interface MomentumGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamStreak {
  team: string;
  season: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  gamesPlayed: number;
}

export interface HotTeam {
  team: string;
  winStreak: number;
  seasonAchieved: number;
}

export interface ColdTeam {
  team: string;
  lossStreak: number;
  seasonAchieved: number;
}

export interface BiggestSwing {
  team: string;
  fromLossStreak: number;
  toLongestWinStreak: number;
  delta: number;
}

export interface WeeklyRecord {
  week: number;
  result: "W" | "L";
  cumulativeWins: number;
  cumulativeLosses: number;
}

export interface SeasonMomentum {
  team: string;
  season: number;
  weeklyRecord: WeeklyRecord[];
}

export interface MomentumResult {
  teamStreaks: TeamStreak[];
  hotTeams: HotTeam[];
  coldTeams: ColdTeam[];
  biggestSwings: BiggestSwing[];
  seasonMomentum: SeasonMomentum[];
}

export function computeMomentumTracker(games: MomentumGame[]): MomentumResult {
  // Sort games by season, then by week
  const sortedGames = [...games].sort((a, b) => {
    if (a.season !== b.season) return a.season - b.season;
    return a.week - b.week;
  });

  // Build game results for each team
  const teamGameMap = new Map<
    string,
    { season: number; week: number; result: "W" | "L" }[]
  >();

  for (const g of sortedGames) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (!homeWon && !awayWon) continue; // Skip ties

    const homeKey = `${g.homeTeamName}:${g.season}`;
    const awayKey = `${g.awayTeamName}:${g.season}`;

    if (!teamGameMap.has(homeKey)) teamGameMap.set(homeKey, []);
    if (!teamGameMap.has(awayKey)) teamGameMap.set(awayKey, []);

    if (homeWon) {
      teamGameMap.get(homeKey)!.push({ season: g.season, week: g.week, result: "W" });
      teamGameMap.get(awayKey)!.push({ season: g.season, week: g.week, result: "L" });
    } else {
      teamGameMap.get(homeKey)!.push({ season: g.season, week: g.week, result: "L" });
      teamGameMap.get(awayKey)!.push({ season: g.season, week: g.week, result: "W" });
    }
  }

  // Compute streaks for each team-season
  const teamStreakMap = new Map<string, TeamStreak>();
  const seasonMomentumMap = new Map<string, SeasonMomentum>();

  for (const [key, gameResults] of teamGameMap.entries()) {
    const [team, season] = key.split(":");
    const seasonNum = parseInt(season);

    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let cumulativeWins = 0;
    let cumulativeLosses = 0;

    const weeklyRecords: WeeklyRecord[] = [];

    for (const g of gameResults) {
      const isWin = g.result === "W";
      if (isWin) cumulativeWins++;
      else cumulativeLosses++;

      if (isWin && currentStreak <= 0) {
        longestLossStreak = Math.max(longestLossStreak, -currentStreak);
        currentStreak = 1;
      } else if (isWin) {
        currentStreak++;
      } else if (!isWin && currentStreak >= 0) {
        longestWinStreak = Math.max(longestWinStreak, currentStreak);
        currentStreak = -1;
      } else {
        currentStreak--;
      }

      weeklyRecords.push({
        week: g.week,
        result: g.result,
        cumulativeWins,
        cumulativeLosses,
      });
    }

    // Final streak check
    if (currentStreak > 0) {
      longestWinStreak = Math.max(longestWinStreak, currentStreak);
    } else if (currentStreak < 0) {
      longestLossStreak = Math.max(longestLossStreak, -currentStreak);
    }

    teamStreakMap.set(key, {
      team,
      season: seasonNum,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      gamesPlayed: gameResults.length,
    });

    seasonMomentumMap.set(key, {
      team,
      season: seasonNum,
      weeklyRecord: weeklyRecords,
    });
  }

  // Get hot teams: top 10 by longest win streak across all seasons
  const hotTeamMap = new Map<string, { winStreak: number; seasonAchieved: number }>();
  for (const streak of teamStreakMap.values()) {
    const existing = hotTeamMap.get(streak.team);
    if (!existing || existing.winStreak < streak.longestWinStreak) {
      hotTeamMap.set(streak.team, {
        winStreak: streak.longestWinStreak,
        seasonAchieved: streak.season,
      });
    }
  }

  const hotTeams: HotTeam[] = Array.from(hotTeamMap.entries())
    .map(([team, data]) => ({
      team,
      winStreak: data.winStreak,
      seasonAchieved: data.seasonAchieved,
    }))
    .sort((a, b) => b.winStreak - a.winStreak)
    .slice(0, 10);

  // Get cold teams: top 10 by longest loss streak across all seasons
  const coldTeamMap = new Map<string, { lossStreak: number; seasonAchieved: number }>();
  for (const streak of teamStreakMap.values()) {
    const existing = coldTeamMap.get(streak.team);
    if (!existing || existing.lossStreak < streak.longestLossStreak) {
      coldTeamMap.set(streak.team, {
        lossStreak: streak.longestLossStreak,
        seasonAchieved: streak.season,
      });
    }
  }

  const coldTeams: ColdTeam[] = Array.from(coldTeamMap.entries())
    .map(([team, data]) => ({
      team,
      lossStreak: data.lossStreak,
      seasonAchieved: data.seasonAchieved,
    }))
    .sort((a, b) => b.lossStreak - a.lossStreak)
    .slice(0, 10);

  // Get biggest swings: delta from longest loss streak to longest win streak
  const swingMap = new Map<string, BiggestSwing>();
  for (const streak of teamStreakMap.values()) {
    const key = streak.team;
    const existing = swingMap.get(key);
    const delta = streak.longestWinStreak + streak.longestLossStreak;

    if (!existing || existing.delta < delta) {
      swingMap.set(key, {
        team: streak.team,
        fromLossStreak: streak.longestLossStreak,
        toLongestWinStreak: streak.longestWinStreak,
        delta,
      });
    }
  }

  const biggestSwings: BiggestSwing[] = Array.from(swingMap.values())
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10);

  return {
    teamStreaks: Array.from(teamStreakMap.values()),
    hotTeams,
    coldTeams,
    biggestSwings,
    seasonMomentum: Array.from(seasonMomentumMap.values()),
  };
}
