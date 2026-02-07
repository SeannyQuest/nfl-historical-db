/**
 * Pure league-wide trend computation — no DB dependency.
 * Operates on arrays of game-like objects to compute historical trends.
 */

export interface TrendGame {
  season: number;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  primetime: string | null;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface SeasonTrend {
  season: number;
  totalGames: number;
  avgTotal: string;
  avgHomeScore: string;
  avgAwayScore: string;
  homeWins: number;
  awayWins: number;
  ties: number;
  homeWinPct: string;
  overs: number;
  unders: number;
  ouPushes: number;
  overPct: string;
  homeCovered: number;
  homeSpreadLost: number;
  spreadPushes: number;
  homeCoverPct: string;
}

export interface PrimetimeTrend {
  slot: string;
  totalGames: number;
  avgTotal: string;
  homeWinPct: string;
  overPct: string;
}

export interface TrendsResult {
  totalGames: number;
  totalSeasons: number;
  overallAvgTotal: string;
  overallHomeWinPct: string;
  overallOverPct: string;
  highestScoringGame: { season: number; total: number };
  lowestScoringGame: { season: number; total: number };
  seasons: SeasonTrend[];
  primetime: PrimetimeTrend[];
  playoffVsRegular: {
    regular: { avgTotal: string; homeWinPct: string };
    playoff: { avgTotal: string; homeWinPct: string };
  };
}

export function computeTrends(games: TrendGame[]): TrendsResult {
  if (games.length === 0) {
    return {
      totalGames: 0,
      totalSeasons: 0,
      overallAvgTotal: "0.0",
      overallHomeWinPct: ".000",
      overallOverPct: ".000",
      highestScoringGame: { season: 0, total: 0 },
      lowestScoringGame: { season: 0, total: 0 },
      seasons: [],
      primetime: [],
      playoffVsRegular: {
        regular: { avgTotal: "0.0", homeWinPct: ".000" },
        playoff: { avgTotal: "0.0", homeWinPct: ".000" },
      },
    };
  }

  let totalPoints = 0;
  let homeWins = 0, awayWins = 0;
  let overs = 0, unders = 0;
  let highestTotal = 0, highestSeason = 0;
  let lowestTotal = Infinity, lowestSeason = 0;

  // Playoff vs regular
  let regPoints = 0, regGames = 0, regHomeWins = 0, regDecisions = 0;
  let playPoints = 0, playGames = 0, playHomeWins = 0, playDecisions = 0;

  // Season map
  const seasonMap = new Map<number, {
    games: number; points: number; homeScoreSum: number; awayScoreSum: number;
    homeWins: number; awayWins: number; ties: number;
    overs: number; unders: number; ouPushes: number;
    homeCovered: number; homeSpreadLost: number; spreadPushes: number;
  }>();

  // Primetime map
  const ptMap = new Map<string, {
    games: number; points: number; homeWins: number; decisions: number;
    overs: number; ouTotal: number;
  }>();

  for (const g of games) {
    const total = g.homeScore + g.awayScore;
    totalPoints += total;

    if (total > highestTotal) { highestTotal = total; highestSeason = g.season; }
    if (total < lowestTotal) { lowestTotal = total; lowestSeason = g.season; }

    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (homeWon) homeWins++;
    else if (awayWon) awayWins++;

    if (g.ouResult === "OVER") overs++;
    else if (g.ouResult === "UNDER") unders++;

    // Playoff vs regular
    if (g.isPlayoff) {
      playPoints += total;
      playGames++;
      if (homeWon || awayWon) playDecisions++;
      if (homeWon) playHomeWins++;
    } else {
      regPoints += total;
      regGames++;
      if (homeWon || awayWon) regDecisions++;
      if (homeWon) regHomeWins++;
    }

    // Season
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, {
        games: 0, points: 0, homeScoreSum: 0, awayScoreSum: 0,
        homeWins: 0, awayWins: 0, ties: 0,
        overs: 0, unders: 0, ouPushes: 0,
        homeCovered: 0, homeSpreadLost: 0, spreadPushes: 0,
      });
    }
    const s = seasonMap.get(g.season)!;
    s.games++;
    s.points += total;
    s.homeScoreSum += g.homeScore;
    s.awayScoreSum += g.awayScore;
    if (homeWon) s.homeWins++;
    else if (awayWon) s.awayWins++;
    else s.ties++;
    if (g.ouResult === "OVER") s.overs++;
    else if (g.ouResult === "UNDER") s.unders++;
    else if (g.ouResult === "PUSH") s.ouPushes++;
    if (g.spreadResult === "COVERED") s.homeCovered++;
    else if (g.spreadResult === "LOST") s.homeSpreadLost++;
    else if (g.spreadResult === "PUSH") s.spreadPushes++;

    // Primetime
    if (g.primetime) {
      if (!ptMap.has(g.primetime)) {
        ptMap.set(g.primetime, { games: 0, points: 0, homeWins: 0, decisions: 0, overs: 0, ouTotal: 0 });
      }
      const p = ptMap.get(g.primetime)!;
      p.games++;
      p.points += total;
      if (homeWon || awayWon) p.decisions++;
      if (homeWon) p.homeWins++;
      if (g.ouResult === "OVER") { p.overs++; p.ouTotal++; }
      else if (g.ouResult === "UNDER" || g.ouResult === "PUSH") { p.ouTotal++; }
    }
  }

  const totalGames = games.length;
  const decisions = homeWins + awayWins;
  const ouTotal = overs + unders;

  const seasons: SeasonTrend[] = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, d]) => {
      const seasonDecisions = d.homeWins + d.awayWins;
      const seasonOUTotal = d.overs + d.unders + d.ouPushes;
      const seasonSpreadTotal = d.homeCovered + d.homeSpreadLost + d.spreadPushes;
      return {
        season,
        totalGames: d.games,
        avgTotal: (d.points / d.games).toFixed(1),
        avgHomeScore: (d.homeScoreSum / d.games).toFixed(1),
        avgAwayScore: (d.awayScoreSum / d.games).toFixed(1),
        homeWins: d.homeWins,
        awayWins: d.awayWins,
        ties: d.ties,
        homeWinPct: seasonDecisions > 0 ? (d.homeWins / seasonDecisions).toFixed(3) : ".000",
        overs: d.overs,
        unders: d.unders,
        ouPushes: d.ouPushes,
        overPct: seasonOUTotal > 0 ? (d.overs / seasonOUTotal).toFixed(3) : ".000",
        homeCovered: d.homeCovered,
        homeSpreadLost: d.homeSpreadLost,
        spreadPushes: d.spreadPushes,
        homeCoverPct: seasonSpreadTotal > 0 ? (d.homeCovered / seasonSpreadTotal).toFixed(3) : ".000",
      };
    });

  const primetime: PrimetimeTrend[] = [...ptMap.entries()]
    .sort(([, a], [, b]) => b.games - a.games)
    .map(([slot, d]) => ({
      slot,
      totalGames: d.games,
      avgTotal: (d.points / d.games).toFixed(1),
      homeWinPct: d.decisions > 0 ? (d.homeWins / d.decisions).toFixed(3) : ".000",
      overPct: d.ouTotal > 0 ? (d.overs / d.ouTotal).toFixed(3) : ".000",
    }));

  return {
    totalGames,
    totalSeasons: seasonMap.size,
    overallAvgTotal: (totalPoints / totalGames).toFixed(1),
    overallHomeWinPct: decisions > 0 ? (homeWins / decisions).toFixed(3) : ".000",
    overallOverPct: ouTotal > 0 ? (overs / ouTotal).toFixed(3) : ".000",
    highestScoringGame: { season: highestSeason, total: highestTotal },
    lowestScoringGame: { season: lowestSeason, total: lowestTotal === Infinity ? 0 : lowestTotal },
    seasons,
    primetime,
    playoffVsRegular: {
      regular: {
        avgTotal: regGames > 0 ? (regPoints / regGames).toFixed(1) : "0.0",
        homeWinPct: regDecisions > 0 ? (regHomeWins / regDecisions).toFixed(3) : ".000",
      },
      playoff: {
        avgTotal: playGames > 0 ? (playPoints / playGames).toFixed(1) : "0.0",
        homeWinPct: playDecisions > 0 ? (playHomeWins / playDecisions).toFixed(3) : ".000",
      },
    },
  };
}
