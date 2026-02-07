/**
 * Pure quarter scoring computation — no DB dependency.
 * Operates on arrays of game-like objects to compute quarterly scoring analytics.
 */

export interface QuarterGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeQ1: number;
  homeQ2: number;
  homeQ3: number;
  homeQ4: number;
  awayQ1: number;
  awayQ2: number;
  awayQ3: number;
  awayQ4: number;
  homeOT?: number;
  awayOT?: number;
}

export interface LeagueByQuarter {
  quarter: string;
  avgPoints: string;
  pctOfTotal: string;
}

export interface TeamQuarterStats {
  team: string;
  q1Avg: string;
  q2Avg: string;
  q3Avg: string;
  q4Avg: string;
  bestQuarter: string;
  worstQuarter: string;
}

export interface FastStarter {
  team: string;
  q1Avg: string;
}

export interface Closer {
  team: string;
  q4Avg: string;
}

export interface ComebackTeam {
  team: string;
  firstHalfAvg: string;
  secondHalfAvg: string;
  differential: string;
}

export interface SeasonQuarterTrend {
  season: number;
  q1Avg: string;
  q2Avg: string;
  q3Avg: string;
  q4Avg: string;
}

export interface QuarterScoringResult {
  leagueByQuarter: LeagueByQuarter[];
  teamByQuarter: TeamQuarterStats[];
  fastStarters: FastStarter[];
  closers: Closer[];
  comebackTeams: ComebackTeam[];
  seasonTrends: SeasonQuarterTrend[];
}

export function computeQuarterScoring(games: QuarterGame[]): QuarterScoringResult {
  // Track league-wide quarter stats
  const leagueQuarterPoints = {
    q1: [] as number[],
    q2: [] as number[],
    q3: [] as number[],
    q4: [] as number[],
    ot: [] as number[],
  };

  // Track team quarter stats
  const teamQuarterMap = new Map<
    string,
    {
      q1: number[];
      q2: number[];
      q3: number[];
      q4: number[];
    }
  >();

  // Track season quarter stats
  const seasonQuarterMap = new Map<
    number,
    {
      q1: number[];
      q2: number[];
      q3: number[];
      q4: number[];
    }
  >();

  for (const g of games) {
    // League stats
    leagueQuarterPoints.q1.push(g.homeQ1, g.awayQ1);
    leagueQuarterPoints.q2.push(g.homeQ2, g.awayQ2);
    leagueQuarterPoints.q3.push(g.homeQ3, g.awayQ3);
    leagueQuarterPoints.q4.push(g.homeQ4, g.awayQ4);
    if (g.homeOT !== undefined) leagueQuarterPoints.ot.push(g.homeOT, g.awayOT || 0);

    // Team stats
    for (const [team, q1, q2, q3, q4] of [
      [g.homeTeamName, g.homeQ1, g.homeQ2, g.homeQ3, g.homeQ4],
      [g.awayTeamName, g.awayQ1, g.awayQ2, g.awayQ3, g.awayQ4],
    ]) {
      if (!teamQuarterMap.has(team as string)) {
        teamQuarterMap.set(team as string, { q1: [], q2: [], q3: [], q4: [] });
      }
      const teamStats = teamQuarterMap.get(team as string)!;
      teamStats.q1.push(q1 as number);
      teamStats.q2.push(q2 as number);
      teamStats.q3.push(q3 as number);
      teamStats.q4.push(q4 as number);
    }

    // Season stats
    if (!seasonQuarterMap.has(g.season)) {
      seasonQuarterMap.set(g.season, { q1: [], q2: [], q3: [], q4: [] });
    }
    const seasonStats = seasonQuarterMap.get(g.season)!;
    seasonStats.q1.push(g.homeQ1, g.awayQ1);
    seasonStats.q2.push(g.homeQ2, g.awayQ2);
    seasonStats.q3.push(g.homeQ3, g.awayQ3);
    seasonStats.q4.push(g.homeQ4, g.awayQ4);
  }

  // Compute league by quarter
  const totalPoints = Object.values(leagueQuarterPoints).reduce(
    (acc, arr) => acc + arr.reduce((a, b) => a + b, 0),
    0
  );

  const leagueByQuarter: LeagueByQuarter[] = [];
  for (const [quarter, points] of Object.entries(leagueQuarterPoints)) {
    if (points.length === 0) continue;
    const avg = points.reduce((a, b) => a + b, 0) / points.length;
    const total = points.reduce((a, b) => a + b, 0);
    const pct = totalPoints > 0 ? (total / totalPoints) * 100 : 0;

    const quarterLabel =
      quarter === "q1"
        ? "Q1"
        : quarter === "q2"
          ? "Q2"
          : quarter === "q3"
            ? "Q3"
            : quarter === "q4"
              ? "Q4"
              : "OT";

    leagueByQuarter.push({
      quarter: quarterLabel,
      avgPoints: avg.toFixed(2),
      pctOfTotal: pct.toFixed(1),
    });
  }

  // Compute team by quarter
  const teamByQuarter: TeamQuarterStats[] = Array.from(teamQuarterMap.entries())
    .map(([team, stats]) => {
      const q1Avg = stats.q1.reduce((a, b) => a + b, 0) / stats.q1.length;
      const q2Avg = stats.q2.reduce((a, b) => a + b, 0) / stats.q2.length;
      const q3Avg = stats.q3.reduce((a, b) => a + b, 0) / stats.q3.length;
      const q4Avg = stats.q4.reduce((a, b) => a + b, 0) / stats.q4.length;

      const quarters = [
        { quarter: "Q1", avg: q1Avg },
        { quarter: "Q2", avg: q2Avg },
        { quarter: "Q3", avg: q3Avg },
        { quarter: "Q4", avg: q4Avg },
      ];

      const bestQuarter = quarters.reduce((a, b) =>
        a.avg > b.avg ? a : b
      ).quarter;
      const worstQuarter = quarters.reduce((a, b) =>
        a.avg < b.avg ? a : b
      ).quarter;

      return {
        team,
        q1Avg: q1Avg.toFixed(2),
        q2Avg: q2Avg.toFixed(2),
        q3Avg: q3Avg.toFixed(2),
        q4Avg: q4Avg.toFixed(2),
        bestQuarter,
        worstQuarter,
      };
    })
    .sort((a, b) => a.team.localeCompare(b.team));

  // Fast starters: top 10 by Q1 avg
  const fastStarters = [...teamByQuarter]
    .sort((a, b) => parseFloat(b.q1Avg) - parseFloat(a.q1Avg))
    .slice(0, 10)
    .map((t) => ({ team: t.team, q1Avg: t.q1Avg }));

  // Closers: top 10 by Q4 avg
  const closers = [...teamByQuarter]
    .sort((a, b) => parseFloat(b.q4Avg) - parseFloat(a.q4Avg))
    .slice(0, 10)
    .map((t) => ({ team: t.team, q4Avg: t.q4Avg }));

  // Comeback teams: Q3+Q4 vs Q1+Q2 differential
  const comebackTeams: ComebackTeam[] = Array.from(teamQuarterMap.entries())
    .map(([team, stats]) => {
      const firstHalf =
        (stats.q1.reduce((a, b) => a + b, 0) + stats.q2.reduce((a, b) => a + b, 0)) / (stats.q1.length + stats.q2.length);
      const secondHalf =
        (stats.q3.reduce((a, b) => a + b, 0) + stats.q4.reduce((a, b) => a + b, 0)) / (stats.q3.length + stats.q4.length);
      const diff = secondHalf - firstHalf;

      return {
        team,
        firstHalfAvg: firstHalf.toFixed(2),
        secondHalfAvg: secondHalf.toFixed(2),
        differential: diff.toFixed(2),
      };
    })
    .sort((a, b) => parseFloat(b.differential) - parseFloat(a.differential))
    .slice(0, 10);

  // Season trends
  const seasonTrends: SeasonQuarterTrend[] = Array.from(seasonQuarterMap.entries())
    .map(([season, stats]) => ({
      season,
      q1Avg: (stats.q1.reduce((a, b) => a + b, 0) / stats.q1.length).toFixed(2),
      q2Avg: (stats.q2.reduce((a, b) => a + b, 0) / stats.q2.length).toFixed(2),
      q3Avg: (stats.q3.reduce((a, b) => a + b, 0) / stats.q3.length).toFixed(2),
      q4Avg: (stats.q4.reduce((a, b) => a + b, 0) / stats.q4.length).toFixed(2),
    }))
    .sort((a, b) => a.season - b.season);

  return {
    leagueByQuarter,
    teamByQuarter,
    fastStarters,
    closers,
    comebackTeams,
    seasonTrends,
  };
}
