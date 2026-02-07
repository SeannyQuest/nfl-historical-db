/**
 * Pure draft capital impact analysis — no DB dependency.
 */

export interface DraftCapitalTeam {
  team: string;
  season: number;
  wins: number;
  losses: number;
  draftPosition: number;
}

export interface PositionGroup {
  range: string;
  avgWins: number;
  avgLosses: number;
  teams: number;
}

export interface DraftCapitalResult {
  positionGroups: PositionGroup[];
  topPickSuccess: number;
  correlation: number;
  bestValuePicks: Array<{
    team: string;
    season: number;
    draftPosition: number;
    wins: number;
    outperformance: number;
  }>;
}

export function computeDraftCapitalImpact(
  teams: DraftCapitalTeam[]
): DraftCapitalResult {
  if (teams.length === 0) {
    return {
      positionGroups: [],
      topPickSuccess: 0,
      correlation: 0,
      bestValuePicks: [],
    };
  }

  // Group by position ranges
  const positionMap = new Map<
    string,
    { totalWins: number; totalLosses: number; count: number; teams: string[] }
  >();

  const ranges = [
    { min: 1, max: 5, label: "1-5" },
    { min: 6, max: 10, label: "6-10" },
    { min: 11, max: 15, label: "11-15" },
    { min: 16, max: 20, label: "16-20" },
    { min: 21, max: 25, label: "21-25" },
    { min: 26, max: 32, label: "26-32" },
  ];

  for (const range of ranges) {
    positionMap.set(range.label, {
      totalWins: 0,
      totalLosses: 0,
      count: 0,
      teams: [],
    });
  }

  for (const team of teams) {
    const range = ranges.find(
      (r) => team.draftPosition >= r.min && team.draftPosition <= r.max
    );
    if (range) {
      const entry = positionMap.get(range.label)!;
      entry.totalWins += team.wins;
      entry.totalLosses += team.losses;
      entry.count++;
      entry.teams.push(team.team);
    }
  }

  const positionGroups: PositionGroup[] = [...positionMap.entries()]
    .map(([label, data]) => ({
      range: label,
      avgWins:
        data.count > 0
          ? parseFloat((data.totalWins / data.count).toFixed(2))
          : 0,
      avgLosses:
        data.count > 0
          ? parseFloat((data.totalLosses / data.count).toFixed(2))
          : 0,
      teams: data.count,
    }))
    .filter((pg) => pg.teams > 0);

  // Calculate top pick success (picks 1-5 win rate)
  const topPickTeams = teams.filter((t) => t.draftPosition >= 1 && t.draftPosition <= 5);
  const topPickWins = topPickTeams.reduce((sum, t) => sum + t.wins, 0);
  const topPickGames = topPickTeams.reduce(
    (sum, t) => sum + t.wins + t.losses,
    0
  );
  const topPickSuccess =
    topPickGames > 0
      ? parseFloat((topPickWins / topPickGames).toFixed(3))
      : 0;

  // Calculate Pearson correlation
  const correlation = calculatePearsonCorrelation(teams);

  // Calculate best value picks (teams that outperform their position group)
  const bestValuePicks: Array<{
    team: string;
    season: number;
    draftPosition: number;
    wins: number;
    outperformance: number;
  }> = [];

  for (const team of teams) {
    const positionGroup = positionGroups.find((pg) => {
      const min = parseInt(pg.range.split("-")[0]);
      const max = parseInt(pg.range.split("-")[1]);
      return team.draftPosition >= min && team.draftPosition <= max;
    });

    if (positionGroup) {
      const outperformance = team.wins - positionGroup.avgWins;
      if (outperformance > 0) {
        bestValuePicks.push({
          team: team.team,
          season: team.season,
          draftPosition: team.draftPosition,
          wins: team.wins,
          outperformance: parseFloat(outperformance.toFixed(2)),
        });
      }
    }
  }

  bestValuePicks.sort((a, b) => b.outperformance - a.outperformance);

  return {
    positionGroups,
    topPickSuccess,
    correlation,
    bestValuePicks: bestValuePicks.slice(0, 10),
  };
}

function calculatePearsonCorrelation(teams: DraftCapitalTeam[]): number {
  if (teams.length < 2) return 0;

  const n = teams.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const team of teams) {
    const x = team.draftPosition;
    const y = team.wins;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;

  return parseFloat((numerator / denominator).toFixed(3));
}
