/**
 * Pure function for computing record-breaking games and streaks — no DB dependency.
 * Analyzes scoring extremes and win/loss streaks.
 */

export interface RecordGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
}

export interface ScoringGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  totalPoints: number;
  homeScore: number;
  awayScore: number;
  margin: number;
  isPlayoff: boolean;
}

export interface SeasonAvg {
  season: number;
  avgTotal: string;
  totalGames: number;
}

export interface Streak {
  team: string;
  streak: number;
  startSeason: number;
  endSeason: number;
}

export interface RecordBreakersResult {
  highestScoringGames: ScoringGame[];
  lowestScoringGames: ScoringGame[];
  biggestBlowouts: ScoringGame[];
  highestScoringSeasons: SeasonAvg[];
  longestWinStreaks: Streak[];
  longestLossStreaks: Streak[];
}

export function computeRecordBreakers(games: RecordGame[]): RecordBreakersResult {
  // Convert to scoring games
  const scoringGames: ScoringGame[] = games.map(g => ({
    season: g.season,
    week: g.week,
    homeTeamName: g.homeTeamName,
    awayTeamName: g.awayTeamName,
    totalPoints: g.homeScore + g.awayScore,
    homeScore: g.homeScore,
    awayScore: g.awayScore,
    margin: Math.abs(g.homeScore - g.awayScore),
    isPlayoff: g.isPlayoff,
  }));

  // Highest scoring games: top 10 by total points
  const highestScoringGames = [...scoringGames]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);

  // Lowest scoring games: bottom 10 (total > 0)
  const lowestScoringGames = [...scoringGames]
    .filter(g => g.totalPoints > 0)
    .sort((a, b) => a.totalPoints - b.totalPoints)
    .slice(0, 10);

  // Biggest blowouts: top 10 by margin
  const biggestBlowouts = [...scoringGames]
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10);

  // Highest scoring seasons: avg total points per season
  const seasonTotalsMap = new Map<number, { totals: number[]; count: number }>();
  for (const g of scoringGames) {
    if (!seasonTotalsMap.has(g.season)) {
      seasonTotalsMap.set(g.season, { totals: [], count: 0 });
    }
    const s = seasonTotalsMap.get(g.season)!;
    s.totals.push(g.totalPoints);
    s.count++;
  }

  const highestScoringSeasons: SeasonAvg[] = Array.from(seasonTotalsMap.entries())
    .map(([season, data]) => ({
      season,
      avgTotal: (data.totals.reduce((a, b) => a + b, 0) / data.count).toFixed(2),
      totalGames: data.count,
    }))
    .sort((a, b) => parseFloat(b.avgTotal) - parseFloat(a.avgTotal));

  // Track win/loss streaks per team
  const teamGamesMap = new Map<string, { season: number; week: string; won: boolean }[]>();
  for (const g of games) {
    if (!teamGamesMap.has(g.homeTeamName)) {
      teamGamesMap.set(g.homeTeamName, []);
    }
    if (!teamGamesMap.has(g.awayTeamName)) {
      teamGamesMap.set(g.awayTeamName, []);
    }

    const homeWon = g.homeScore > g.awayScore;
    teamGamesMap.get(g.homeTeamName)!.push({ season: g.season, week: g.week, won: homeWon });
    teamGamesMap.get(g.awayTeamName)!.push({ season: g.season, week: g.week, won: !homeWon });
  }

  // Find longest win and loss streaks
  const longestWinStreaks: Streak[] = [];
  const longestLossStreaks: Streak[] = [];

  for (const [team, gamesForTeam] of teamGamesMap) {
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let winStreakStart = 0;
    let winStreakEnd = 0;
    let lossStreakStart = 0;
    let lossStreakEnd = 0;

    for (let i = 0; i < gamesForTeam.length; i++) {
      const g = gamesForTeam[i];

      if (g.won) {
        currentWinStreak++;
        if (currentWinStreak === 1) {
          winStreakStart = g.season;
        }
        winStreakEnd = g.season;
        currentLossStreak = 0;

        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak;
        }
      } else {
        currentLossStreak++;
        if (currentLossStreak === 1) {
          lossStreakStart = g.season;
        }
        lossStreakEnd = g.season;
        currentWinStreak = 0;

        if (currentLossStreak > maxLossStreak) {
          maxLossStreak = currentLossStreak;
        }
      }
    }

    if (maxWinStreak > 0) {
      longestWinStreaks.push({
        team,
        streak: maxWinStreak,
        startSeason: winStreakStart,
        endSeason: winStreakEnd,
      });
    }
    if (maxLossStreak > 0) {
      longestLossStreaks.push({
        team,
        streak: maxLossStreak,
        startSeason: lossStreakStart,
        endSeason: lossStreakEnd,
      });
    }
  }

  longestWinStreaks.sort((a, b) => b.streak - a.streak);
  longestLossStreaks.sort((a, b) => b.streak - a.streak);

  return {
    highestScoringGames,
    lowestScoringGames,
    biggestBlowouts,
    highestScoringSeasons,
    longestWinStreaks,
    longestLossStreaks,
  };
}
