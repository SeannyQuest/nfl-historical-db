/**
 * Pure consistency index analysis — no DB dependency.
 */

export interface ConsistencyGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamConsistency {
  team: string;
  season: number;
  avgPointsScored: number;
  stdDevScored: number;
  avgPointsAllowed: number;
  stdDevAllowed: number;
  consistencyScore: number;
}

export interface SeasonConsistencyTrend {
  season: number;
  leagueAvgConsistency: number;
}

export interface ConsistencyIndexResult {
  teamConsistency: TeamConsistency[];
  mostConsistent: TeamConsistency[];
  leastConsistent: TeamConsistency[];
  seasonComparison: SeasonConsistencyTrend[];
}

function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function consistencyScore(stdDev: number): number {
  // Lower stdDev = higher consistency. Formula: 1 / (1 + stdDev)
  return parseFloat((1 / (1 + stdDev)).toFixed(3));
}

export function computeConsistencyIndex(games: ConsistencyGame[]): ConsistencyIndexResult {
  if (games.length === 0) {
    return {
      teamConsistency: [],
      mostConsistent: [],
      leastConsistent: [],
      seasonComparison: [],
    };
  }

  // Build per-team, per-season statistics
  const teamSeasonMap = new Map<string, { pointsScored: number[]; pointsAllowed: number[] }>();

  for (const g of games) {
    const key = `${g.homeTeamName}|${g.season}`;
    const entry = teamSeasonMap.get(key) || { pointsScored: [], pointsAllowed: [] };
    entry.pointsScored.push(g.homeScore);
    entry.pointsAllowed.push(g.awayScore);
    teamSeasonMap.set(key, entry);

    const awayKey = `${g.awayTeamName}|${g.season}`;
    const awayEntry = teamSeasonMap.get(awayKey) || { pointsScored: [], pointsAllowed: [] };
    awayEntry.pointsScored.push(g.awayScore);
    awayEntry.pointsAllowed.push(g.homeScore);
    teamSeasonMap.set(awayKey, awayEntry);
  }

  // Compute consistency metrics
  const teamConsistency: TeamConsistency[] = [...teamSeasonMap.entries()]
    .map(([key, data]) => {
      const [team, season] = key.split("|");
      const avgScored = parseFloat((data.pointsScored.reduce((a, b) => a + b, 0) / data.pointsScored.length).toFixed(1));
      const stdDevScored = parseFloat(stdDev(data.pointsScored).toFixed(2));
      const avgAllowed = parseFloat((data.pointsAllowed.reduce((a, b) => a + b, 0) / data.pointsAllowed.length).toFixed(1));
      const stdDevAllowed = parseFloat(stdDev(data.pointsAllowed).toFixed(2));
      const score = consistencyScore(stdDevScored);

      return {
        team,
        season: parseInt(season, 10),
        avgPointsScored: avgScored,
        stdDevScored,
        avgPointsAllowed: avgAllowed,
        stdDevAllowed,
        consistencyScore: score,
      };
    })
    .sort((a, b) => b.consistencyScore - a.consistencyScore);

  // Most/least consistent (top/bottom 10)
  const mostConsistent = teamConsistency.slice(0, 10);
  const leastConsistent = teamConsistency.slice(-10).reverse();

  // Season comparison: average consistency across all teams
  const seasonMap = new Map<number, number[]>();

  for (const tc of teamConsistency) {
    const scores = seasonMap.get(tc.season) || [];
    scores.push(tc.consistencyScore);
    seasonMap.set(tc.season, scores);
  }

  const seasonComparison: SeasonConsistencyTrend[] = [...seasonMap.entries()]
    .map(([season, scores]) => ({
      season,
      leagueAvgConsistency: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(3)),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamConsistency,
    mostConsistent,
    leastConsistent,
    seasonComparison,
  };
}
