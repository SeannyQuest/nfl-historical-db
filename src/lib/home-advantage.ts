/**
 * Pure home-field advantage computation — no DB dependency.
 * Operates on arrays of game-like objects to compute home advantage analytics.
 */

export interface HomeAdvantageGame {
  season: number;
  date: string;
  dayOfWeek: string | null;
  isPlayoff: boolean;
  primetime: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  conditions: string | null;
  spread: number | null;
  spreadResult: string | null;
}

export interface HomeAdvantageResult {
  overallHomeWinRate: string;
  homeWinRateBySeasonTrend: Array<{ season: number; homeWinPct: string }>;
  homeWinRateByDayOfWeek: Array<{ day: string; games: number; homeWinPct: string }>;
  homeWinRateByPrimetime: Array<{ slot: string; games: number; homeWinPct: string }>;
  playoffVsRegularHomeWinRate: {
    regular: string;
    playoff: string;
  };
  homeScoringAdvantage: string;
  homeCoverRate: string;
  bestHomeTeams: Array<{ team: string; homeWins: number; homeLosses: number; homeWinPct: string }>;
  worstHomeTeams: Array<{ team: string; homeWins: number; homeLosses: number; homeWinPct: string }>;
  domeVsOutdoorAdvantage: {
    dome: string | null;
    outdoor: string | null;
  };
}

export function computeHomeAdvantage(games: HomeAdvantageGame[]): HomeAdvantageResult {
  if (games.length === 0) {
    return {
      overallHomeWinRate: ".000",
      homeWinRateBySeasonTrend: [],
      homeWinRateByDayOfWeek: [],
      homeWinRateByPrimetime: [],
      playoffVsRegularHomeWinRate: {
        regular: ".000",
        playoff: ".000",
      },
      homeScoringAdvantage: "0.0",
      homeCoverRate: ".000",
      bestHomeTeams: [],
      worstHomeTeams: [],
      domeVsOutdoorAdvantage: {
        dome: null,
        outdoor: null,
      },
    };
  }

  // Overall home win rate
  let homeWins = 0;
  let homeLosses = 0;
  let totalHomeScore = 0;
  let totalAwayScore = 0;
  let homeCovered = 0;
  let homeCoverTotal = 0;

  // Season trends
  const seasonMap = new Map<number, { homeWins: number; decisions: number }>();

  // Day of week
  const dayMap = new Map<string, { homeWins: number; decisions: number }>();

  // Primetime
  const ptMap = new Map<string, { homeWins: number; decisions: number }>();

  // Playoff vs regular
  let regHomeWins = 0,
    regDecisions = 0;
  let playHomeWins = 0,
    playDecisions = 0;

  // Team home records
  const teamHomeMap = new Map<
    string,
    { wins: number; losses: number }
  >();

  // Dome vs outdoor
  const domeMap = new Map<string, { homeWins: number; decisions: number }>();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (homeWon) homeWins++;
    else if (awayWon) homeLosses++;

    totalHomeScore += g.homeScore;
    totalAwayScore += g.awayScore;

    // Cover rate (spread)
    if (g.spreadResult) {
      homeCoverTotal++;
      if (g.spreadResult === "COVERED") homeCovered++;
    }

    // Season trend
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { homeWins: 0, decisions: 0 });
    }
    const season = seasonMap.get(g.season)!;
    if (homeWon || awayWon) season.decisions++;
    if (homeWon) season.homeWins++;

    // Day of week
    if (g.dayOfWeek) {
      if (!dayMap.has(g.dayOfWeek)) {
        dayMap.set(g.dayOfWeek, { homeWins: 0, decisions: 0 });
      }
      const day = dayMap.get(g.dayOfWeek)!;
      if (homeWon || awayWon) day.decisions++;
      if (homeWon) day.homeWins++;
    }

    // Primetime
    if (g.primetime) {
      if (!ptMap.has(g.primetime)) {
        ptMap.set(g.primetime, { homeWins: 0, decisions: 0 });
      }
      const pt = ptMap.get(g.primetime)!;
      if (homeWon || awayWon) pt.decisions++;
      if (homeWon) pt.homeWins++;
    }

    // Playoff vs regular
    if (g.isPlayoff) {
      if (homeWon || awayWon) playDecisions++;
      if (homeWon) playHomeWins++;
    } else {
      if (homeWon || awayWon) regDecisions++;
      if (homeWon) regHomeWins++;
    }

    // Team home records
    if (!teamHomeMap.has(g.homeTeamName)) {
      teamHomeMap.set(g.homeTeamName, { wins: 0, losses: 0 });
    }
    const team = teamHomeMap.get(g.homeTeamName)!;
    if (homeWon) team.wins++;
    else if (awayWon) team.losses++;

    // Dome vs outdoor
    if (g.conditions) {
      const condKey = g.conditions.includes("Dome") || g.conditions.includes("dome") ? "dome" : "outdoor";
      if (!domeMap.has(condKey)) {
        domeMap.set(condKey, { homeWins: 0, decisions: 0 });
      }
      const cond = domeMap.get(condKey)!;
      if (homeWon || awayWon) cond.decisions++;
      if (homeWon) cond.homeWins++;
    }
  }

  const totalDecisions = homeWins + homeLosses;

  // Build results
  const homeWinRateBySeasonTrend = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      homeWinPct: data.decisions > 0 ? (data.homeWins / data.decisions).toFixed(3) : ".000",
    }));

  const homeWinRateByDayOfWeek = [...dayMap.entries()]
    .sort((a, b) => b[1].decisions - a[1].decisions)
    .map(([day, data]) => ({
      day,
      games: data.decisions,
      homeWinPct: data.decisions > 0 ? (data.homeWins / data.decisions).toFixed(3) : ".000",
    }));

  const homeWinRateByPrimetime = [...ptMap.entries()]
    .sort((a, b) => b[1].decisions - a[1].decisions)
    .map(([slot, data]) => ({
      slot,
      games: data.decisions,
      homeWinPct: data.decisions > 0 ? (data.homeWins / data.decisions).toFixed(3) : ".000",
    }));

  const bestHomeTeams = [...teamHomeMap.entries()]
    .filter(([, data]) => data.wins + data.losses > 0)
    .sort((a, b) => {
      const aWinPct = a[1].wins / (a[1].wins + a[1].losses);
      const bWinPct = b[1].wins / (b[1].wins + b[1].losses);
      if (bWinPct !== aWinPct) return bWinPct - aWinPct;
      return b[1].wins - a[1].wins;
    })
    .slice(0, 10)
    .map(([team, data]) => ({
      team,
      homeWins: data.wins,
      homeLosses: data.losses,
      homeWinPct: ((data.wins / (data.wins + data.losses)) * 100).toFixed(1) + "%",
    }));

  const worstHomeTeams = [...teamHomeMap.entries()]
    .filter(([, data]) => data.wins + data.losses > 0)
    .sort((a, b) => {
      const aWinPct = a[1].wins / (a[1].wins + a[1].losses);
      const bWinPct = b[1].wins / (b[1].wins + b[1].losses);
      if (aWinPct !== bWinPct) return aWinPct - bWinPct;
      return a[1].wins - b[1].wins;
    })
    .slice(0, 10)
    .map(([team, data]) => ({
      team,
      homeWins: data.wins,
      homeLosses: data.losses,
      homeWinPct: ((data.wins / (data.wins + data.losses)) * 100).toFixed(1) + "%",
    }));

  const domeVsOutdoor = {
    dome: domeMap.has("dome")
      ? ((domeMap.get("dome")!.homeWins / domeMap.get("dome")!.decisions) * 100).toFixed(1) + "%"
      : null,
    outdoor: domeMap.has("outdoor")
      ? ((domeMap.get("outdoor")!.homeWins / domeMap.get("outdoor")!.decisions) * 100).toFixed(1) + "%"
      : null,
  };

  return {
    overallHomeWinRate: totalDecisions > 0 ? (homeWins / totalDecisions).toFixed(3) : ".000",
    homeWinRateBySeasonTrend,
    homeWinRateByDayOfWeek,
    homeWinRateByPrimetime,
    playoffVsRegularHomeWinRate: {
      regular: regDecisions > 0 ? (regHomeWins / regDecisions).toFixed(3) : ".000",
      playoff: playDecisions > 0 ? (playHomeWins / playDecisions).toFixed(3) : ".000",
    },
    homeScoringAdvantage:
      games.length > 0 ? ((totalHomeScore - totalAwayScore) / games.length).toFixed(1) : "0.0",
    homeCoverRate: homeCoverTotal > 0 ? (homeCovered / homeCoverTotal).toFixed(3) : ".000",
    bestHomeTeams,
    worstHomeTeams,
    domeVsOutdoorAdvantage: domeVsOutdoor,
  };
}
