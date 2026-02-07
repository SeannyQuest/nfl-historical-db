/**
 * Pure upset/underdog computation — no DB dependency.
 * Operates on arrays of game-like objects to compute upset analytics.
 */

export interface UpsetGame {
  season: number;
  date: string;
  week: string;
  isPlayoff: boolean;
  primetime: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  playoffRound: string | null;
}

export interface UpsetEntry {
  season: number;
  week: string;
  date: string;
  isPlayoff: boolean;
  underdogTeam: string;
  favoriteTeam: string;
  score: string;
  spread: number;
  spreadMarginOfVictory: number;
}

export interface UpsetsResult {
  biggestUpsets: UpsetEntry[];
  upsetRateBySeasonTrend: Array<{ season: number; upsetPct: string }>;
  upsetRateBySpreadRange: Array<{
    range: string;
    games: number;
    upsets: number;
    upsetPct: string;
  }>;
  upsetRateByPrimetime: Array<{
    slot: string;
    games: number;
    upsets: number;
    upsetPct: string;
  }>;
  upsetRateByPlayoffRound: Array<{
    round: string;
    games: number;
    upsets: number;
    upsetPct: string;
  }>;
  mostCommonUpsettingTeams: Array<{
    team: string;
    upsetWins: number;
    totalWins: number;
    upsetWinPct: string;
  }>;
  longestUpsetsWinStreaks: Array<{
    team: string;
    streakLength: number;
    startDate: string;
    endDate: string;
  }>;
  overallUpsetRate: string;
}

function isUnderdog(spread: number | null, homeScore: number, awayScore: number): boolean {
  if (spread === null) return false;
  // spread is from home perspective (negative = home favored)
  // Away team is underdog if spread > 0 (home is favored)
  // Home team is underdog if spread < 0 (away is favored)
  // Upset is when underdog wins
  const awayIsUnderdog = spread > 0;
  const homeIsUnderdog = spread < 0;

  if (awayIsUnderdog && awayScore > homeScore) return true;
  if (homeIsUnderdog && homeScore > awayScore) return true;
  return false;
}

function getUnderdogTeam(spread: number | null, homeTeam: string, awayTeam: string): string | null {
  if (spread === null) return null;
  if (spread > 0) return awayTeam;
  if (spread < 0) return homeTeam;
  return null;
}

function getFavoriteTeam(spread: number | null, homeTeam: string, awayTeam: string): string | null {
  if (spread === null) return null;
  if (spread > 0) return homeTeam;
  if (spread < 0) return awayTeam;
  return null;
}

export function computeUpsets(games: UpsetGame[]): UpsetsResult {
  if (games.length === 0) {
    return {
      biggestUpsets: [],
      upsetRateBySeasonTrend: [],
      upsetRateBySpreadRange: [],
      upsetRateByPrimetime: [],
      upsetRateByPlayoffRound: [],
      mostCommonUpsettingTeams: [],
      longestUpsetsWinStreaks: [],
      overallUpsetRate: ".000",
    };
  }

  let totalUpsets = 0;
  let totalGamesWithSpread = 0;

  const upsetEntries: UpsetEntry[] = [];
  const seasonMap = new Map<number, { upsets: number; total: number }>();
  const spreadRangeMap = new Map<string, { upsets: number; total: number }>();
  const primetimeMap = new Map<string, { upsets: number; total: number }>();
  const playoffRoundMap = new Map<string, { upsets: number; total: number }>();
  const teamUpsetsMap = new Map<string, { upsetWins: number; totalWins: number }>();
  const teamUpsetStreaksMap = new Map<string, UpsetEntry[]>();

  for (const g of games) {
    if (g.spread === null) continue;

    const upset = isUnderdog(g.spread, g.homeScore, g.awayScore);
    const underdogTeam = getUnderdogTeam(g.spread, g.homeTeamName, g.awayTeamName);
    const favoriteTeam = getFavoriteTeam(g.spread, g.homeTeamName, g.awayTeamName);

    totalGamesWithSpread++;
    if (upset) totalUpsets++;

    // Upset entries for biggest upsets
    if (upset) {
      const scoreStr = `${g.awayScore}-${g.homeScore}`;
      const spreadMarginOfVictory = Math.abs(
        (g.homeScore > g.awayScore ? g.homeScore - g.awayScore : g.awayScore - g.homeScore) - Math.abs(g.spread)
      );
      upsetEntries.push({
        season: g.season,
        week: g.week,
        date: g.date,
        isPlayoff: g.isPlayoff,
        underdogTeam: underdogTeam || "",
        favoriteTeam: favoriteTeam || "",
        score: scoreStr,
        spread: g.spread,
        spreadMarginOfVictory,
      });

      // Team upsets tracking
      if (underdogTeam) {
        if (!teamUpsetsMap.has(underdogTeam)) {
          teamUpsetsMap.set(underdogTeam, { upsetWins: 0, totalWins: 0 });
        }
        const teamUpsets = teamUpsetsMap.get(underdogTeam)!;
        teamUpsets.upsetWins++;
        teamUpsets.totalWins++;

        // Upset streaks
        if (!teamUpsetStreaksMap.has(underdogTeam)) {
          teamUpsetStreaksMap.set(underdogTeam, []);
        }
        teamUpsetStreaksMap.get(underdogTeam)!.push({
          season: g.season,
          week: g.week,
          date: g.date,
          isPlayoff: g.isPlayoff,
          underdogTeam: underdogTeam,
          favoriteTeam: favoriteTeam || "",
          score: scoreStr,
          spread: g.spread,
          spreadMarginOfVictory,
        });
      }
    } else {
      // Non-upset win by a team with spread
      if (underdogTeam) {
        if (!teamUpsetsMap.has(underdogTeam)) {
          teamUpsetsMap.set(underdogTeam, { upsetWins: 0, totalWins: 0 });
        }
        teamUpsetsMap.get(underdogTeam)!.totalWins++;
      }
    }

    // Season trend
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { upsets: 0, total: 0 });
    }
    const season = seasonMap.get(g.season)!;
    season.total++;
    if (upset) season.upsets++;

    // Spread range
    const spreadAbs = Math.abs(g.spread);
    let range = "";
    if (spreadAbs > 0 && spreadAbs <= 3) range = "PK-3pt";
    else if (spreadAbs > 3 && spreadAbs <= 7) range = "3-7pt";
    else if (spreadAbs > 7 && spreadAbs <= 10) range = "7-10pt";
    else if (spreadAbs > 10) range = "10+pt";

    if (range) {
      if (!spreadRangeMap.has(range)) {
        spreadRangeMap.set(range, { upsets: 0, total: 0 });
      }
      const sr = spreadRangeMap.get(range)!;
      sr.total++;
      if (upset) sr.upsets++;
    }

    // Primetime
    if (g.primetime) {
      if (!primetimeMap.has(g.primetime)) {
        primetimeMap.set(g.primetime, { upsets: 0, total: 0 });
      }
      const pt = primetimeMap.get(g.primetime)!;
      pt.total++;
      if (upset) pt.upsets++;
    }

    // Playoff round
    if (g.isPlayoff && g.playoffRound) {
      if (!playoffRoundMap.has(g.playoffRound)) {
        playoffRoundMap.set(g.playoffRound, { upsets: 0, total: 0 });
      }
      const pr = playoffRoundMap.get(g.playoffRound)!;
      pr.total++;
      if (upset) pr.upsets++;
    }
  }

  // Biggest upsets by margin vs spread
  const biggestUpsets = upsetEntries
    .sort((a, b) => b.spreadMarginOfVictory - a.spreadMarginOfVictory)
    .slice(0, 15);

  // Season trend
  const upsetRateBySeasonTrend = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      upsetPct: data.total > 0 ? (data.upsets / data.total).toFixed(3) : ".000",
    }));

  // Spread range — ensure consistent order
  const spreadRangeOrder = ["PK-3pt", "3-7pt", "7-10pt", "10+pt"];
  const upsetRateBySpreadRange = spreadRangeOrder
    .map((range) => {
      const data = spreadRangeMap.get(range);
      if (!data) return null;
      return {
        range,
        games: data.total,
        upsets: data.upsets,
        upsetPct: data.total > 0 ? (data.upsets / data.total).toFixed(3) : ".000",
      };
    })
    .filter((x) => x !== null) as Array<{
    range: string;
    games: number;
    upsets: number;
    upsetPct: string;
  }>;

  // Primetime
  const upsetRateByPrimetime = [...primetimeMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([slot, data]) => ({
      slot,
      games: data.total,
      upsets: data.upsets,
      upsetPct: data.total > 0 ? (data.upsets / data.total).toFixed(3) : ".000",
    }));

  // Playoff round
  const upsetRateByPlayoffRound = [...playoffRoundMap.entries()]
    .map(([round, data]) => ({
      round,
      games: data.total,
      upsets: data.upsets,
      upsetPct: data.total > 0 ? (data.upsets / data.total).toFixed(3) : ".000",
    }));

  // Most common upsetting teams
  const mostCommonUpsettingTeams = [...teamUpsetsMap.entries()]
    .filter(([, data]) => data.upsetWins > 0)
    .sort((a, b) => {
      const aRate = a[1].upsetWins / a[1].totalWins;
      const bRate = b[1].upsetWins / b[1].totalWins;
      if (bRate !== aRate) return bRate - aRate;
      return b[1].upsetWins - a[1].upsetWins;
    })
    .slice(0, 15)
    .map(([team, data]) => ({
      team,
      upsetWins: data.upsetWins,
      totalWins: data.totalWins,
      upsetWinPct: ((data.upsetWins / data.totalWins) * 100).toFixed(1) + "%",
    }));

  // Longest active underdog win streaks
  const longestUpsetsWinStreaks = [...teamUpsetStreaksMap.entries()]
    .map(([team, upsetGames]) => {
      // Sort by date ascending to find streaks
      const sorted = [...upsetGames].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length === 0) return null;

      // For now, just take the last upset as "active" streak
      // In a real system, we'd track consecutive upset wins
      const lastUpset = sorted[sorted.length - 1];
      return {
        team,
        streakLength: sorted.length, // simplified: count all upsets as streak
        startDate: sorted[0].date,
        endDate: lastUpset.date,
      };
    })
    .filter((x) => x !== null)
    .sort((a, b) => (b?.streakLength || 0) - (a?.streakLength || 0))
    .slice(0, 10) as Array<{
    team: string;
    streakLength: number;
    startDate: string;
    endDate: string;
  }>;

  return {
    biggestUpsets,
    upsetRateBySeasonTrend,
    upsetRateBySpreadRange,
    upsetRateByPrimetime,
    upsetRateByPlayoffRound,
    mostCommonUpsettingTeams,
    longestUpsetsWinStreaks,
    overallUpsetRate: totalGamesWithSpread > 0 ? (totalUpsets / totalGamesWithSpread).toFixed(3) : ".000",
  };
}
