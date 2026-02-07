/**
 * Pure scoring margin analysis — no DB dependency.
 */

export interface MarginGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface MarginDistribution {
  margin: number;
  count: number;
  pct: number;
}

export interface TeamMargin {
  team: string;
  avgMarginWin: number;
  avgMarginLoss: number;
  blowoutWins: number;
  closeWins: number;
}

export interface SeasonMarginTrend {
  season: number;
  avgMargin: number;
  closeGamePct: number;
}

export interface ScoringMarginsResult {
  marginDistribution: MarginDistribution[];
  avgMargin: number;
  teamMargins: TeamMargin[];
  seasonTrends: SeasonMarginTrend[];
}

export function computeScoringMargins(games: MarginGame[]): ScoringMarginsResult {
  if (games.length === 0) {
    return {
      marginDistribution: [],
      avgMargin: 0,
      teamMargins: [],
      seasonTrends: [],
    };
  }

  // Compute all margins (absolute value of difference)
  const margins = games.map((g) => Math.abs(g.homeScore - g.awayScore));
  const totalMargin = margins.reduce((a, b) => a + b, 0);
  const avgMargin = totalMargin / margins.length;

  // Distribution: group margins into buckets (0-5, 6-10, 11-15, 16-20, 21-25, 26-30, 31+)
  const buckets: Record<string, number> = {
    "0-5": 0,
    "6-10": 0,
    "11-15": 0,
    "16-20": 0,
    "21-25": 0,
    "26-30": 0,
    "31+": 0,
  };

  for (const margin of margins) {
    if (margin <= 5) buckets["0-5"]++;
    else if (margin <= 10) buckets["6-10"]++;
    else if (margin <= 15) buckets["11-15"]++;
    else if (margin <= 20) buckets["16-20"]++;
    else if (margin <= 25) buckets["21-25"]++;
    else if (margin <= 30) buckets["26-30"]++;
    else buckets["31+"]++;
  }

  const marginDistribution: MarginDistribution[] = [
    { margin: 2.5, count: buckets["0-5"], pct: parseFloat(((buckets["0-5"] / games.length) * 100).toFixed(1)) },
    { margin: 8, count: buckets["6-10"], pct: parseFloat(((buckets["6-10"] / games.length) * 100).toFixed(1)) },
    { margin: 13, count: buckets["11-15"], pct: parseFloat(((buckets["11-15"] / games.length) * 100).toFixed(1)) },
    { margin: 18, count: buckets["16-20"], pct: parseFloat(((buckets["16-20"] / games.length) * 100).toFixed(1)) },
    { margin: 23, count: buckets["21-25"], pct: parseFloat(((buckets["21-25"] / games.length) * 100).toFixed(1)) },
    { margin: 28, count: buckets["26-30"], pct: parseFloat(((buckets["26-30"] / games.length) * 100).toFixed(1)) },
    { margin: 31, count: buckets["31+"], pct: parseFloat(((buckets["31+"] / games.length) * 100).toFixed(1)) },
  ];

  // Team margins: win and loss averages
  const teamMap = new Map<string, { winMargins: number[]; lossMargins: number[] }>();

  for (const g of games) {
    const margin = Math.abs(g.homeScore - g.awayScore);

    if (g.homeScore > g.awayScore) {
      // Home wins
      const homeEntry = teamMap.get(g.homeTeamName) || { winMargins: [], lossMargins: [] };
      homeEntry.winMargins.push(margin);
      teamMap.set(g.homeTeamName, homeEntry);

      const awayEntry = teamMap.get(g.awayTeamName) || { winMargins: [], lossMargins: [] };
      awayEntry.lossMargins.push(margin);
      teamMap.set(g.awayTeamName, awayEntry);
    } else if (g.awayScore > g.homeScore) {
      // Away wins
      const awayEntry = teamMap.get(g.awayTeamName) || { winMargins: [], lossMargins: [] };
      awayEntry.winMargins.push(margin);
      teamMap.set(g.awayTeamName, awayEntry);

      const homeEntry = teamMap.get(g.homeTeamName) || { winMargins: [], lossMargins: [] };
      homeEntry.lossMargins.push(margin);
      teamMap.set(g.homeTeamName, homeEntry);
    }
  }

  const teamMargins: TeamMargin[] = [...teamMap.entries()].map(([team, data]) => {
    const avgWin =
      data.winMargins.length > 0
        ? parseFloat((data.winMargins.reduce((a, b) => a + b, 0) / data.winMargins.length).toFixed(1))
        : 0;
    const avgLoss =
      data.lossMargins.length > 0
        ? parseFloat((data.lossMargins.reduce((a, b) => a + b, 0) / data.lossMargins.length).toFixed(1))
        : 0;
    const blowoutWins = data.winMargins.filter((m) => m >= 21).length;
    const closeWins = data.winMargins.filter((m) => m <= 3).length;

    return {
      team,
      avgMarginWin: avgWin,
      avgMarginLoss: avgLoss,
      blowoutWins,
      closeWins,
    };
  });

  // Season trends
  const seasonMap = new Map<number, { margins: number[]; closeCount: number }>();

  for (const g of games) {
    const margin = Math.abs(g.homeScore - g.awayScore);
    const entry = seasonMap.get(g.season) || { margins: [], closeCount: 0 };
    entry.margins.push(margin);
    if (margin <= 3) entry.closeCount++;
    seasonMap.set(g.season, entry);
  }

  const seasonTrends: SeasonMarginTrend[] = [...seasonMap.entries()]
    .map(([season, data]) => ({
      season,
      avgMargin: parseFloat((data.margins.reduce((a, b) => a + b, 0) / data.margins.length).toFixed(1)),
      closeGamePct: parseFloat(((data.closeCount / data.margins.length) * 100).toFixed(1)),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    marginDistribution,
    avgMargin: parseFloat(avgMargin.toFixed(1)),
    teamMargins,
    seasonTrends,
  };
}
