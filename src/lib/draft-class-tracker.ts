/**
 * Pure draft class impact tracker computation — no DB dependency.
 * Analyzes year-over-year improvements and regression to the mean.
 */

export interface DraftClassTeam {
  team: string;
  season: number;
  wins: number;
  losses: number;
  prevSeasonWins: number;
  prevSeasonLosses: number;
}

export interface YearOverYear {
  team: string;
  season: number;
  prevWins: number;
  currWins: number;
  improvement: number;
  improvementPct: number;
}

export interface BiggestImprovement {
  team: string;
  season: number;
  prevWins: number;
  currWins: number;
  improvement: number;
  improvementPct: number;
  prevRecord: string;
  currRecord: string;
}

export interface AvgImprovementByRecord {
  prevRecordRange: string;
  avgImprovement: number;
  teamCount: number;
}

export interface RegressionToMean {
  prevWinPct: string;
  nextSeasonAvgWinPct: number;
  teamsCount: number;
}

export interface DraftClassTrackerResult {
  yearOverYear: YearOverYear[];
  biggestImprovements: BiggestImprovement[];
  biggestDeclines: BiggestImprovement[];
  avgImprovementByPrevRecord: AvgImprovementByRecord[];
  regressionToMean: RegressionToMean[];
}

function getRecordRange(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "0-0";

  if (wins <= 4) return "0-4";
  if (wins <= 8) return "5-8";
  if (wins <= 12) return "9-12";
  return "13+";
}

function getWinPctBucket(winPct: number): string {
  if (winPct <= 0.25) return "0.00-0.25";
  if (winPct <= 0.375) return "0.26-0.37";
  if (winPct <= 0.5) return "0.38-0.50";
  if (winPct <= 0.625) return "0.51-0.62";
  if (winPct <= 0.75) return "0.63-0.75";
  return "0.76-1.00";
}

export function computeDraftClassImpact(teams: DraftClassTeam[]): DraftClassTrackerResult {
  if (teams.length === 0) {
    return {
      yearOverYear: [],
      biggestImprovements: [],
      biggestDeclines: [],
      avgImprovementByPrevRecord: [],
      regressionToMean: [],
    };
  }

  // Calculate year-over-year changes
  const yearOverYearList: YearOverYear[] = [];

  for (const team of teams) {
    const improvement = team.wins - team.prevSeasonWins;
    const improvementPct = team.prevSeasonWins > 0 ? (improvement / team.prevSeasonWins) * 100 : 0;

    yearOverYearList.push({
      team: team.team,
      season: team.season,
      prevWins: team.prevSeasonWins,
      currWins: team.wins,
      improvement,
      improvementPct: Math.round(improvementPct * 100) / 100,
    });
  }

  // Sort for biggest improvements and declines
  const sortedYoY = [...yearOverYearList].sort((a, b) => b.improvement - a.improvement);

  const biggestImprovements: BiggestImprovement[] = sortedYoY
    .slice(0, 10)
    .map((yoy) => {
      const prevTeam = teams.find((t) => t.team === yoy.team && t.season === yoy.season);
      return {
        team: yoy.team,
        season: yoy.season,
        prevWins: yoy.prevWins,
        currWins: yoy.currWins,
        improvement: yoy.improvement,
        improvementPct: yoy.improvementPct,
        prevRecord: `${yoy.prevWins}-${prevTeam?.prevSeasonLosses || 0}`,
        currRecord: `${yoy.currWins}-${prevTeam?.losses || 0}`,
      };
    });

  const biggestDeclines: BiggestImprovement[] = sortedYoY
    .slice(-10)
    .reverse()
    .map((yoy) => {
      const prevTeam = teams.find((t) => t.team === yoy.team && t.season === yoy.season);
      return {
        team: yoy.team,
        season: yoy.season,
        prevWins: yoy.prevWins,
        currWins: yoy.currWins,
        improvement: yoy.improvement,
        improvementPct: yoy.improvementPct,
        prevRecord: `${yoy.prevWins}-${prevTeam?.prevSeasonLosses || 0}`,
        currRecord: `${yoy.currWins}-${prevTeam?.losses || 0}`,
      };
    });

  // Average improvement by previous record range
  const recordRangeMap = new Map<string, { improvements: number[]; count: number }>();

  for (const yoy of yearOverYearList) {
    const team = teams.find((t) => t.team === yoy.team && t.season === yoy.season);
    if (!team) continue;

    const range = getRecordRange(team.prevSeasonWins, team.prevSeasonLosses);
    if (!recordRangeMap.has(range)) {
      recordRangeMap.set(range, { improvements: [], count: 0 });
    }
    const data = recordRangeMap.get(range)!;
    data.improvements.push(yoy.improvement);
    data.count++;
  }

  const avgImprovementByPrevRecord: AvgImprovementByRecord[] = Array.from(recordRangeMap.entries())
    .map(([range, data]) => ({
      prevRecordRange: range,
      avgImprovement: Math.round((data.improvements.reduce((a, b) => a + b, 0) / data.improvements.length) * 100) / 100,
      teamCount: data.count,
    }))
    .sort((a, b) => {
      const order = ["0-4", "5-8", "9-12", "13+"];
      return order.indexOf(a.prevRecordRange) - order.indexOf(b.prevRecordRange);
    });

  // Regression to the mean
  const winPctMap = new Map<string, { nextWinPcts: number[]; count: number }>();

  // First pass: collect all win percentages and their next season data
  for (const team of teams) {
    const prevTotal = team.prevSeasonWins + team.prevSeasonLosses;
    if (prevTotal === 0) continue;

    const prevWinPct = team.prevSeasonWins / prevTotal;
    const bucket = getWinPctBucket(prevWinPct);

    if (!winPctMap.has(bucket)) {
      winPctMap.set(bucket, { nextWinPcts: [], count: 0 });
    }
    const data = winPctMap.get(bucket)!;

    const currTotal = team.wins + team.losses;
    if (currTotal > 0) {
      const currWinPct = team.wins / currTotal;
      data.nextWinPcts.push(currWinPct);
      data.count++;
    }
  }

  const regressionToMean: RegressionToMean[] = Array.from(winPctMap.entries())
    .map(([bucket, data]) => ({
      prevWinPct: bucket,
      nextSeasonAvgWinPct:
        data.nextWinPcts.length > 0
          ? Math.round((data.nextWinPcts.reduce((a, b) => a + b, 0) / data.nextWinPcts.length) * 10000) / 10000
          : 0,
      teamsCount: data.count,
    }))
    .sort((a, b) => {
      const order = ["0.00-0.25", "0.26-0.37", "0.38-0.50", "0.51-0.62", "0.63-0.75", "0.76-1.00"];
      return order.indexOf(a.prevWinPct) - order.indexOf(b.prevWinPct);
    });

  return {
    yearOverYear: yearOverYearList,
    biggestImprovements,
    biggestDeclines,
    avgImprovementByPrevRecord,
    regressionToMean,
  };
}
