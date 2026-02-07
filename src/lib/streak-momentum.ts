/**
 * Winning Streak Momentum — how teams on winning/losing streaks perform ATS.
 * Pure function, no DB dependency.
 */

export interface StreakGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  spreadResult: string | null;
}

export interface StreakPerformance {
  streakLength: string; // "1", "2", "3", "4", "5+", etc.
  suWinPct: string;
  atsRecord: {
    wins: number;
    losses: number;
    pct: string;
  };
}

export interface TeamStreakATS {
  team: string;
  onWinStreakATSPct: string;
  onLossStreakATSPct: string;
  winStreakATSWins: number;
  winStreakATSLosses: number;
  lossStreakATSWins: number;
  lossStreakATSLosses: number;
}

export interface BestStreakATSRecord {
  team: string;
  winStreakLength: number;
  atsWins: number;
  atsLosses: number;
  atsPct: string;
}

export interface StreakMomentumResult {
  streakPerformance: StreakPerformance[];
  teamStreakATS: TeamStreakATS[];
  bestStreakATS: BestStreakATSRecord[];
}

export function computeStreakMomentum(games: StreakGame[]): StreakMomentumResult {
  if (games.length === 0) {
    return {
      streakPerformance: [],
      teamStreakATS: [],
      bestStreakATS: [],
    };
  }

  // Sort games by season and week to track streaks properly
  const sortedGames = [...games].sort((a, b) => a.season - b.season || a.week - b.week);

  // Track win/loss streaks for each team
  const teamStreakMap = new Map<
    string,
    {
      currentStreak: { length: number; type: "win" | "loss"; games: StreakGame[] };
      allStreaks: { length: number; type: "win" | "loss"; games: StreakGame[] }[];
    }
  >();

  // Process games to track streaks
  for (const g of sortedGames) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    // Home team
    if (!teamStreakMap.has(g.homeTeamName)) {
      teamStreakMap.set(g.homeTeamName, {
        currentStreak: { length: 0, type: "win", games: [] },
        allStreaks: [],
      });
    }
    const homeEntry = teamStreakMap.get(g.homeTeamName)!;
    const homeStreakType = homeWon ? "win" : "loss";

    if (homeEntry.currentStreak.length === 0) {
      homeEntry.currentStreak = { length: 1, type: homeStreakType, games: [g] };
    } else if (homeStreakType === homeEntry.currentStreak.type) {
      homeEntry.currentStreak.length++;
      homeEntry.currentStreak.games.push(g);
    } else {
      homeEntry.allStreaks.push(homeEntry.currentStreak);
      homeEntry.currentStreak = { length: 1, type: homeStreakType, games: [g] };
    }

    // Away team
    if (!teamStreakMap.has(g.awayTeamName)) {
      teamStreakMap.set(g.awayTeamName, {
        currentStreak: { length: 0, type: "win", games: [] },
        allStreaks: [],
      });
    }
    const awayEntry = teamStreakMap.get(g.awayTeamName)!;
    const awayStreakType = awayWon ? "win" : "loss";

    if (awayEntry.currentStreak.length === 0) {
      awayEntry.currentStreak = { length: 1, type: awayStreakType, games: [g] };
    } else if (awayStreakType === awayEntry.currentStreak.type) {
      awayEntry.currentStreak.length++;
      awayEntry.currentStreak.games.push(g);
    } else {
      awayEntry.allStreaks.push(awayEntry.currentStreak);
      awayEntry.currentStreak = { length: 1, type: awayStreakType, games: [g] };
    }
  }

  // Finalize current streaks
  for (const [_, entry] of teamStreakMap) {
    if (entry.currentStreak.length > 0) {
      entry.allStreaks.push(entry.currentStreak);
    }
  }

  // Calculate streak performance (how teams perform ATS during streaks)
  const streakPerformanceMap = new Map<
    string,
    {
      suWins: number;
      suLosses: number;
      atsWins: number;
      atsLosses: number;
    }
  >();

  for (const [team, entry] of teamStreakMap) {
    for (const streak of entry.allStreaks) {
      const key = streak.type === "win" ? `w${streak.length}` : `l${streak.length}`;
      if (!streakPerformanceMap.has(key)) {
        streakPerformanceMap.set(key, { suWins: 0, suLosses: 0, atsWins: 0, atsLosses: 0 });
      }

      const record = streakPerformanceMap.get(key)!;
      for (const g of streak.games) {
        const isTeamHome = g.homeTeamName === team;
        const teamWon = isTeamHome
          ? g.homeScore > g.awayScore
          : g.awayScore > g.homeScore;

        if (teamWon) {
          record.suWins++;
        } else {
          record.suLosses++;
        }

        if (g.spreadResult === "COVERED" || g.spreadResult === "PUSH") {
          record.atsWins++;
        } else if (g.spreadResult === "LOST") {
          record.atsLosses++;
        }
      }
    }
  }

  // Build streak performance array
  const streakPerformance: StreakPerformance[] = [...streakPerformanceMap]
    .map(([key, record]) => {
      const suTotal = record.suWins + record.suLosses;
      const atsTotal = record.atsWins + record.atsLosses;
      return {
        streakLength: key,
        suWinPct:
          suTotal > 0 ? ((record.suWins / suTotal) * 100).toFixed(1) : "0.0",
        atsRecord: {
          wins: record.atsWins,
          losses: record.atsLosses,
          pct:
            atsTotal > 0 ? (record.atsWins / atsTotal).toFixed(3) : ".000",
        },
      };
    });

  // Calculate team streak ATS stats
  const teamStreakATSMap = new Map<
    string,
    {
      winStreakATSWins: number;
      winStreakATSLosses: number;
      lossStreakATSWins: number;
      lossStreakATSLosses: number;
    }
  >();

  for (const [team, entry] of teamStreakMap) {
    if (!teamStreakATSMap.has(team)) {
      teamStreakATSMap.set(team, {
        winStreakATSWins: 0,
        winStreakATSLosses: 0,
        lossStreakATSWins: 0,
        lossStreakATSLosses: 0,
      });
    }

    const stats = teamStreakATSMap.get(team)!;
    for (const streak of entry.allStreaks) {
      for (const g of streak.games) {
        if (g.spreadResult === null) continue;

        const isWin = g.homeScore > g.awayScore;
        const atsWin = g.spreadResult === "COVERED" || g.spreadResult === "PUSH";

        if (streak.type === "win") {
          if (atsWin) stats.winStreakATSWins++;
          else stats.winStreakATSLosses++;
        } else {
          if (atsWin) stats.lossStreakATSWins++;
          else stats.lossStreakATSLosses++;
        }
      }
    }
  }

  const teamStreakATS: TeamStreakATS[] = [...teamStreakATSMap]
    .map(([team, stats]) => ({
      team,
      onWinStreakATSPct:
        stats.winStreakATSWins + stats.winStreakATSLosses > 0
          ? (stats.winStreakATSWins / (stats.winStreakATSWins + stats.winStreakATSLosses)).toFixed(3)
          : ".000",
      onLossStreakATSPct:
        stats.lossStreakATSWins + stats.lossStreakATSLosses > 0
          ? (stats.lossStreakATSWins / (stats.lossStreakATSWins + stats.lossStreakATSLosses)).toFixed(3)
          : ".000",
      winStreakATSWins: stats.winStreakATSWins,
      winStreakATSLosses: stats.winStreakATSLosses,
      lossStreakATSWins: stats.lossStreakATSWins,
      lossStreakATSLosses: stats.lossStreakATSLosses,
    }))
    .sort(
      (a, b) =>
        parseFloat(b.onWinStreakATSPct) - parseFloat(a.onWinStreakATSPct)
    );

  // Build best streak ATS (top 10 teams by ATS % on 3+ game win streak)
  const bestStreakATSList: BestStreakATSRecord[] = [];
  for (const [team, entry] of teamStreakMap) {
    for (const streak of entry.allStreaks) {
      if (streak.type === "win" && streak.length >= 3) {
        let atsWins = 0;
        let atsLosses = 0;
        for (const g of streak.games) {
          if (g.spreadResult === null) continue;
          if (g.spreadResult === "COVERED" || g.spreadResult === "PUSH") {
            atsWins++;
          } else {
            atsLosses++;
          }
        }

        if (atsWins + atsLosses > 0) {
          bestStreakATSList.push({
            team,
            winStreakLength: streak.length,
            atsWins,
            atsLosses,
            atsPct: (atsWins / (atsWins + atsLosses)).toFixed(3),
          });
        }
      }
    }
  }

  const bestStreakATS = bestStreakATSList
    .sort((a, b) => parseFloat(b.atsPct) - parseFloat(a.atsPct))
    .slice(0, 10);

  return {
    streakPerformance,
    teamStreakATS,
    bestStreakATS,
  };
}
