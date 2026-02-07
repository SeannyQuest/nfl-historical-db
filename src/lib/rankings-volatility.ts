/**
 * Pure rankings volatility analysis — no DB dependency.
 * Measures how much power rankings change week to week.
 */

export interface VolatilityGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface WeeklyVolatility {
  season: number;
  week: number;
  avgRankChange: number;
}

export interface MostVolatileWeek {
  season: number;
  week: number;
  avgRankChange: number;
  gameCount: number;
}

export interface MostVolatileTeam {
  team: string;
  avgRankChange: number;
  appearances: number;
}

export interface MostStableTeam {
  team: string;
  avgRankChange: number;
  appearances: number;
}

export interface RankingsVolatilityResult {
  weeklyVolatility: WeeklyVolatility[];
  mostVolatileWeeks: MostVolatileWeek[];
  mostStableTeams: MostStableTeam[];
  mostVolatileTeams: MostVolatileTeam[];
}

/**
 * Compute simple power rankings based on wins/losses in games
 * Higher score = better ranking (rank 1)
 */
function computePowerRankings(games: VolatilityGame[]): Map<string, number> {
  const teamStats = new Map<string, { wins: number; losses: number }>();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    const homeEntry = teamStats.get(g.homeTeamName) || { wins: 0, losses: 0 };
    if (homeWon) homeEntry.wins++;
    else if (awayWon) homeEntry.losses++;
    teamStats.set(g.homeTeamName, homeEntry);

    const awayEntry = teamStats.get(g.awayTeamName) || { wins: 0, losses: 0 };
    if (awayWon) awayEntry.wins++;
    else if (homeWon) awayEntry.losses++;
    teamStats.set(g.awayTeamName, awayEntry);
  }

  // Create rankings map: higher score = higher ranking
  const rankings = new Map<string, number>();
  for (const [team, stats] of teamStats) {
    const total = stats.wins + stats.losses;
    const winPct = total > 0 ? stats.wins / total : 0;
    rankings.set(team, winPct * 100);
  }

  return rankings;
}

export function computeRankingsVolatility(games: VolatilityGame[]): RankingsVolatilityResult {
  // Group games by season and week
  const seasonWeekMap = new Map<string, VolatilityGame[]>();

  for (const g of games) {
    const key = `${g.season}|${g.week}`;
    if (!seasonWeekMap.has(key)) {
      seasonWeekMap.set(key, []);
    }
    seasonWeekMap.get(key)!.push(g);
  }

  // Group by season for cumulative ranking calculation
  const seasonGames = new Map<number, VolatilityGame[]>();
  for (const g of games) {
    if (!seasonGames.has(g.season)) {
      seasonGames.set(g.season, []);
    }
    seasonGames.get(g.season)!.push(g);
  }

  // Compute weekly volatility
  const weeklyVolatilityList: WeeklyVolatility[] = [];
  const teamRankChangeMap = new Map<string, { totalChange: number; count: number }>();

  for (const [key, weekGames] of seasonWeekMap) {
    const [seasonStr, weekStr] = key.split("|");
    const season = parseInt(seasonStr, 10);
    const week = parseInt(weekStr, 10);

    // Get all games up to and including this week
    const allGames = (seasonGames.get(season) || [])
      .filter((g) => g.week <= week)
      .sort((a, b) => a.week - b.week);

    // Compute ranking before this week
    const gamesBefore = allGames.filter((g) => g.week < week);
    const rankingsBefore = computePowerRankings(gamesBefore.length > 0 ? gamesBefore : []);

    // Compute ranking after this week
    const rankingsAfter = computePowerRankings(allGames);

    // Calculate avg rank change for all teams involved in this week's games
    let totalRankChange = 0;
    const teamsInWeek = new Set<string>();

    for (const g of weekGames) {
      teamsInWeek.add(g.homeTeamName);
      teamsInWeek.add(g.awayTeamName);
    }

    for (const team of teamsInWeek) {
      const before = rankingsBefore.get(team) || 0;
      const after = rankingsAfter.get(team) || 0;
      const change = Math.abs(after - before);
      totalRankChange += change;

      // Track for team volatility
      const entry = teamRankChangeMap.get(team) || { totalChange: 0, count: 0 };
      entry.totalChange += change;
      entry.count++;
      teamRankChangeMap.set(team, entry);
    }

    const avgRankChange = teamsInWeek.size > 0 ? totalRankChange / teamsInWeek.size : 0;

    weeklyVolatilityList.push({
      season,
      week,
      avgRankChange,
    });
  }

  // Get top 10 most volatile weeks
  const mostVolatileWeeks: MostVolatileWeek[] = weeklyVolatilityList
    .map((wv) => ({
      season: wv.season,
      week: wv.week,
      avgRankChange: wv.avgRankChange,
      gameCount: (seasonWeekMap.get(`${wv.season}|${wv.week}`) || []).length,
    }))
    .sort((a, b) => b.avgRankChange - a.avgRankChange)
    .slice(0, 10);

  // Get team volatility stats
  const mostVolatileTeams: MostVolatileTeam[] = [...teamRankChangeMap.entries()]
    .map(([team, data]) => ({
      team,
      avgRankChange: data.count > 0 ? data.totalChange / data.count : 0,
      appearances: data.count,
    }))
    .sort((a, b) => b.avgRankChange - a.avgRankChange)
    .slice(0, 10);

  // Get most stable teams (lowest volatility)
  const mostStableTeams: MostStableTeam[] = [...teamRankChangeMap.entries()]
    .map(([team, data]) => ({
      team,
      avgRankChange: data.count > 0 ? data.totalChange / data.count : 0,
      appearances: data.count,
    }))
    .sort((a, b) => a.avgRankChange - b.avgRankChange)
    .slice(0, 10);

  return {
    weeklyVolatility: weeklyVolatilityList,
    mostVolatileWeeks,
    mostStableTeams,
    mostVolatileTeams,
  };
}
