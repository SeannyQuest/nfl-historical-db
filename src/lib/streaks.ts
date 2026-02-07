/**
 * Pure streak computation — no DB dependency.
 * Analyzes winning, losing, and ATS streaks.
 */

export interface StreakGame {
  season: number;
  date: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  spreadResult: string | null;
  ouResult: string | null;
  isPlayoff: boolean;
}

export interface TeamStreak {
  teamName: string;
  streakType: "WIN" | "LOSS" | "HOME_WIN" | "AWAY_WIN" | "ATS" | "OVER";
  currentStreak: number;
  season: number;
  allTimeRecord: number;
  allTimeSeasons: string;
}

export interface StreaksResult {
  currentStreaks: TeamStreak[];
  longestWinningStreaks: TeamStreak[];
  longestLosingStreaks: TeamStreak[];
  longestHomeWinStreaks: TeamStreak[];
  longestAwayWinStreaks: TeamStreak[];
  longestATSStreaks: TeamStreak[];
  longestOverStreaks: TeamStreak[];
}

function buildStreakData(games: StreakGame[], teamName: string): Map<string, number[]> {
  const streakMap = new Map<string, number[]>();
  let currentWinStreak = 0,
    currentLossStreak = 0;
  let currentHomeWinStreak = 0;
  let currentAwayWinStreak = 0;
  let currentATSStreak = 0;
  let currentOverStreak = 0;

  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];
  const homeWinStreaks: number[] = [];
  const awayWinStreaks: number[] = [];
  const atsStreaks: number[] = [];
  const overStreaks: number[] = [];

  for (const g of games) {
    const isHome = g.homeTeamName === teamName;
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;
    const teamWon = (isHome && homeWon) || (!isHome && awayWon);

    // Win/Loss streaks
    if (teamWon) {
      if (currentLossStreak > 0) lossStreaks.push(currentLossStreak);
      currentLossStreak = 0;
      currentWinStreak++;
    } else if ((isHome && awayWon) || (!isHome && homeWon)) {
      if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
      currentWinStreak = 0;
      currentLossStreak++;
    }

    // Home win streaks
    if (isHome && homeWon) {
      if (currentHomeWinStreak === 0 && currentAwayWinStreak > 0) awayWinStreaks.push(currentAwayWinStreak);
      currentAwayWinStreak = 0;
      currentHomeWinStreak++;
    } else if (isHome && awayWon) {
      if (currentHomeWinStreak > 0) homeWinStreaks.push(currentHomeWinStreak);
      currentHomeWinStreak = 0;
    }

    // Away win streaks
    if (!isHome && awayWon) {
      if (currentAwayWinStreak === 0 && currentHomeWinStreak > 0) homeWinStreaks.push(currentHomeWinStreak);
      currentHomeWinStreak = 0;
      currentAwayWinStreak++;
    } else if (!isHome && homeWon) {
      if (currentAwayWinStreak > 0) awayWinStreaks.push(currentAwayWinStreak);
      currentAwayWinStreak = 0;
    }

    // ATS streaks
    if (g.spreadResult === "COVERED") {
      currentATSStreak++;
    } else if (g.spreadResult === "LOST") {
      if (currentATSStreak > 0) atsStreaks.push(currentATSStreak);
      currentATSStreak = 0;
    }

    // Over streaks
    if (g.ouResult === "OVER") {
      currentOverStreak++;
    } else if (g.ouResult === "UNDER") {
      if (currentOverStreak > 0) overStreaks.push(currentOverStreak);
      currentOverStreak = 0;
    }
  }

  // Finalize streaks
  if (currentWinStreak > 0) winStreaks.push(currentWinStreak);
  if (currentLossStreak > 0) lossStreaks.push(currentLossStreak);
  if (currentHomeWinStreak > 0) homeWinStreaks.push(currentHomeWinStreak);
  if (currentAwayWinStreak > 0) awayWinStreaks.push(currentAwayWinStreak);
  if (currentATSStreak > 0) atsStreaks.push(currentATSStreak);
  if (currentOverStreak > 0) overStreaks.push(currentOverStreak);

  streakMap.set("WIN", [currentWinStreak, ...winStreaks.sort((a, b) => b - a)]);
  streakMap.set("LOSS", [currentLossStreak, ...lossStreaks.sort((a, b) => b - a)]);
  streakMap.set("HOME_WIN", [currentHomeWinStreak, ...homeWinStreaks.sort((a, b) => b - a)]);
  streakMap.set("AWAY_WIN", [currentAwayWinStreak, ...awayWinStreaks.sort((a, b) => b - a)]);
  streakMap.set("ATS", [currentATSStreak, ...atsStreaks.sort((a, b) => b - a)]);
  streakMap.set("OVER", [currentOverStreak, ...overStreaks.sort((a, b) => b - a)]);

  return streakMap;
}

export function computeStreaks(games: StreakGame[]): StreaksResult {
  if (games.length === 0) {
    return {
      currentStreaks: [],
      longestWinningStreaks: [],
      longestLosingStreaks: [],
      longestHomeWinStreaks: [],
      longestAwayWinStreaks: [],
      longestATSStreaks: [],
      longestOverStreaks: [],
    };
  }

  // Get unique teams
  const teams = new Set<string>();
  for (const g of games) {
    teams.add(g.homeTeamName);
    teams.add(g.awayTeamName);
  }

  const currentStreaks: TeamStreak[] = [];
  const longestWins: TeamStreak[] = [];
  const longestLosses: TeamStreak[] = [];
  const longestHomeWins: TeamStreak[] = [];
  const longestAwayWins: TeamStreak[] = [];
  const longestATS: TeamStreak[] = [];
  const longestOvers: TeamStreak[] = [];

  for (const team of teams) {
    const teamGames = games.filter((g) => g.homeTeamName === team || g.awayTeamName === team);
    if (teamGames.length === 0) continue;

    const streakMap = buildStreakData(teamGames, team);
    const currentSeason = Math.max(...teamGames.map((g) => g.season));

    // Current win streak
    const winStreaks = streakMap.get("WIN") ?? [];
    if (winStreaks[0] > 0) {
      currentStreaks.push({
        teamName: team,
        streakType: "WIN",
        currentStreak: winStreaks[0],
        season: currentSeason,
        allTimeRecord: winStreaks[1] ?? 0,
        allTimeSeasons: teamGames[0].season.toString(),
      });
    }

    // Current loss streak
    const lossStreaks = streakMap.get("LOSS") ?? [];
    if (lossStreaks[0] > 0) {
      currentStreaks.push({
        teamName: team,
        streakType: "LOSS",
        currentStreak: lossStreaks[0],
        season: currentSeason,
        allTimeRecord: lossStreaks[1] ?? 0,
        allTimeSeasons: teamGames[0].season.toString(),
      });
    }

    // Add to all-time lists
    if (winStreaks.length > 0) {
      longestWins.push({
        teamName: team,
        streakType: "WIN",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: winStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }

    if (lossStreaks.length > 0) {
      longestLosses.push({
        teamName: team,
        streakType: "LOSS",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: lossStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }

    const homeWinStreaks = streakMap.get("HOME_WIN") ?? [];
    if (homeWinStreaks.length > 0) {
      longestHomeWins.push({
        teamName: team,
        streakType: "HOME_WIN",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: homeWinStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }

    const awayWinStreaks = streakMap.get("AWAY_WIN") ?? [];
    if (awayWinStreaks.length > 0) {
      longestAwayWins.push({
        teamName: team,
        streakType: "AWAY_WIN",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: awayWinStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }

    const atsStreaks = streakMap.get("ATS") ?? [];
    if (atsStreaks.length > 0) {
      longestATS.push({
        teamName: team,
        streakType: "ATS",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: atsStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }

    const overStreaks = streakMap.get("OVER") ?? [];
    if (overStreaks.length > 0) {
      longestOvers.push({
        teamName: team,
        streakType: "OVER",
        currentStreak: 0,
        season: currentSeason,
        allTimeRecord: overStreaks[0],
        allTimeSeasons: `${teamGames[0].season}-${currentSeason}`,
      });
    }
  }

  return {
    currentStreaks: currentStreaks.sort((a, b) => b.currentStreak - a.currentStreak).slice(0, 10),
    longestWinningStreaks: longestWins.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 10),
    longestLosingStreaks: longestLosses.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 10),
    longestHomeWinStreaks: longestHomeWins.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 5),
    longestAwayWinStreaks: longestAwayWins.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 5),
    longestATSStreaks: longestATS.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 5),
    longestOverStreaks: longestOvers.sort((a, b) => b.allTimeRecord - a.allTimeRecord).slice(0, 5),
  };
}
