/**
 * Pure function for computing weekly power rankings — no DB dependency.
 * Tracks team performance and power trends across weeks.
 */

export interface WeeklyGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface WeeklyRanking {
  team: string;
  wins: number;
  losses: number;
  pointDiff: number;
  powerScore: string;
}

export interface SeasonWeeklyRankings {
  season: number;
  week: number;
  rankings: WeeklyRanking[];
}

export interface Riser {
  team: string;
  season: number;
  weekFrom: number;
  weekTo: number;
  rankChange: number;
}

export interface WeekOverWeekPower {
  season: number;
  team: string;
  weeklyPower: { week: number; rank: number; powerScore: string }[];
}

export interface WeeklyPowerResult {
  weeklyRankings: SeasonWeeklyRankings[];
  biggestRisers: Riser[];
  biggestFallers: Riser[];
  weekOverWeek: WeekOverWeekPower[];
}

export function computeWeeklyPower(games: WeeklyGame[]): WeeklyPowerResult {
  // Build team records by season, week
  const seasonWeekData = new Map<
    string,
    Map<
      number,
      Map<
        string,
        {
          wins: number;
          losses: number;
          pointDiff: number;
        }
      >
    >
  >();

  for (const g of games) {
    const seasonKey = g.season.toString();
    if (!seasonWeekData.has(seasonKey)) {
      seasonWeekData.set(seasonKey, new Map());
    }
    const weekMap = seasonWeekData.get(seasonKey)!;

    if (!weekMap.has(g.week)) {
      weekMap.set(g.week, new Map());
    }
    const teamMap = weekMap.get(g.week)!;

    // Home team
    if (!teamMap.has(g.homeTeamName)) {
      teamMap.set(g.homeTeamName, { wins: 0, losses: 0, pointDiff: 0 });
    }
    const homeStats = teamMap.get(g.homeTeamName)!;
    const homeWon = g.homeScore > g.awayScore;
    if (homeWon) homeStats.wins++;
    else homeStats.losses++;
    homeStats.pointDiff += g.homeScore - g.awayScore;

    // Away team
    if (!teamMap.has(g.awayTeamName)) {
      teamMap.set(g.awayTeamName, { wins: 0, losses: 0, pointDiff: 0 });
    }
    const awayStats = teamMap.get(g.awayTeamName)!;
    const awayWon = g.awayScore > g.homeScore;
    if (awayWon) awayStats.wins++;
    else awayStats.losses++;
    awayStats.pointDiff += g.awayScore - g.homeScore;
  }

  // Generate weekly rankings
  const weeklyRankings: SeasonWeeklyRankings[] = [];
  const weekOverWeekMap = new Map<string, Map<number, WeeklyRanking>>();

  for (const [seasonStr, weekMap] of seasonWeekData) {
    const season = parseInt(seasonStr, 10);

    for (const [week, teamMap] of weekMap) {
      const rankings: WeeklyRanking[] = Array.from(teamMap.entries())
        .map(([team, stats]) => {
          const powerScore = stats.wins * 10 + stats.pointDiff / 10;
          return {
            team,
            wins: stats.wins,
            losses: stats.losses,
            pointDiff: stats.pointDiff,
            powerScore: powerScore.toFixed(2),
          };
        })
        .sort((a, b) => parseFloat(b.powerScore) - parseFloat(a.powerScore));

      weeklyRankings.push({ season, week, rankings });

      // Track week-over-week for each team
      for (const ranking of rankings) {
        const key = `${season}-${ranking.team}`;
        if (!weekOverWeekMap.has(key)) {
          weekOverWeekMap.set(key, new Map());
        }
        const teamWeeks = weekOverWeekMap.get(key)!;
        teamWeeks.set(week, ranking);
      }
    }
  }

  // Build week-over-week view
  const weekOverWeek: WeekOverWeekPower[] = [];
  const seasonTeamMap = new Map<string, Map<number, WeeklyRanking>>();

  for (const [seasonStr, weekMap] of seasonWeekData) {
    const season = parseInt(seasonStr, 10);
    const teamMap = new Map<string, WeeklyRanking[]>();

    for (const [week, teams] of weekMap) {
      for (const [team] of teams) {
        if (!teamMap.has(team)) {
          teamMap.set(team, []);
        }
      }
    }

    for (const [team] of teamMap) {
      const weeks: { week: number; rank: number; powerScore: string }[] = [];
      const weekSorted = Array.from(weekMap.keys()).sort((a, b) => a - b);

      for (const week of weekSorted) {
        const teamStats = weekMap.get(week)?.get(team);
        if (teamStats) {
          const powerScore = teamStats.wins * 10 + teamStats.pointDiff / 10;
          // Find rank in weekly rankings
          const weekRankings = weeklyRankings.find(w => w.season === season && w.week === week);
          const rank = weekRankings?.rankings.findIndex(r => r.team === team) ?? -1;
          weeks.push({
            week,
            rank: rank + 1,
            powerScore: powerScore.toFixed(2),
          });
        }
      }

      if (weeks.length > 0) {
        weekOverWeek.push({ season, team, weeklyPower: weeks });
      }
    }
  }

  // Detect risers and fallers
  const risers: Riser[] = [];
  const fallers: Riser[] = [];

  for (const wk of weekOverWeek) {
    const power = wk.weeklyPower;
    for (let i = 1; i < power.length; i++) {
      const prev = power[i - 1];
      const curr = power[i];
      const rankChange = prev.rank - curr.rank; // positive = riser, negative = faller

      if (rankChange > 3) {
        risers.push({
          team: wk.team,
          season: wk.season,
          weekFrom: prev.week,
          weekTo: curr.week,
          rankChange,
        });
      } else if (rankChange < -3) {
        fallers.push({
          team: wk.team,
          season: wk.season,
          weekFrom: prev.week,
          weekTo: curr.week,
          rankChange: Math.abs(rankChange),
        });
      }
    }
  }

  risers.sort((a, b) => b.rankChange - a.rankChange);
  fallers.sort((a, b) => b.rankChange - a.rankChange);

  return {
    weeklyRankings: weeklyRankings.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.week - b.week;
    }),
    biggestRisers: risers,
    biggestFallers: fallers,
    weekOverWeek,
  };
}
