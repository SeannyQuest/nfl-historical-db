/**
 * Pure roster continuity score analysis — no DB dependency.
 */

export interface RosterTeam {
  team: string;
  season: number;
  wins: number;
  losses: number;
  returningSalaryPct: number;
}

export interface ContinuityImpact {
  highContinuity: number;
  medContinuity: number;
  lowContinuity: number;
}

export interface TeamContinuity {
  team: string;
  season: number;
  returningSalaryPct: number;
  wins: number;
  losses: number;
}

export interface RosterContinuityResult {
  continuityImpact: ContinuityImpact;
  teamContinuity: TeamContinuity[];
  bestRetention: TeamContinuity[];
  correlation: number;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length === 0 || x.length !== y.length) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xVal, i) => a + xVal * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function computeRosterContinuity(teams: RosterTeam[]): RosterContinuityResult {
  if (teams.length === 0) {
    return {
      continuityImpact: { highContinuity: 0, medContinuity: 0, lowContinuity: 0 },
      teamContinuity: [],
      bestRetention: [],
      correlation: 0,
    };
  }

  const teamContinuity: TeamContinuity[] = teams.map((t) => ({
    team: t.team,
    season: t.season,
    returningSalaryPct: t.returningSalaryPct,
    wins: t.wins,
    losses: t.losses,
  }));

  // Categorize by continuity level and calculate average wins
  const highContinuity: number[] = [];
  const medContinuity: number[] = [];
  const lowContinuity: number[] = [];

  for (const t of teams) {
    if (t.returningSalaryPct > 0.7) {
      highContinuity.push(t.wins);
    } else if (t.returningSalaryPct >= 0.4) {
      medContinuity.push(t.wins);
    } else {
      lowContinuity.push(t.wins);
    }
  }

  const highAvg = highContinuity.length > 0
    ? parseFloat((highContinuity.reduce((a, b) => a + b, 0) / highContinuity.length).toFixed(1))
    : 0;
  const medAvg = medContinuity.length > 0
    ? parseFloat((medContinuity.reduce((a, b) => a + b, 0) / medContinuity.length).toFixed(1))
    : 0;
  const lowAvg = lowContinuity.length > 0
    ? parseFloat((lowContinuity.reduce((a, b) => a + b, 0) / lowContinuity.length).toFixed(1))
    : 0;

  // Best retention: top 10 by returningSalaryPct
  const bestRetention = [...teamContinuity]
    .sort((a, b) => b.returningSalaryPct - a.returningSalaryPct)
    .slice(0, 10);

  // Pearson correlation between continuity and wins
  const continuityScores = teams.map((t) => t.returningSalaryPct);
  const winCounts = teams.map((t) => t.wins);
  const correlation = parseFloat(calculatePearsonCorrelation(continuityScores, winCounts).toFixed(3));

  return {
    continuityImpact: {
      highContinuity: highAvg,
      medContinuity: medAvg,
      lowContinuity: lowAvg,
    },
    teamContinuity,
    bestRetention,
    correlation,
  };
}
