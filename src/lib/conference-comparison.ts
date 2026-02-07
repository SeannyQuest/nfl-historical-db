/**
 * Pure conference comparison computation — no DB dependency.
 * Operates on arrays of game-like objects to compute inter-conference analytics.
 */

export interface ConferenceTeam {
  conference: string;
}

export interface ConferenceGame {
  season: number;
  homeTeam: ConferenceTeam;
  awayTeam: ConferenceTeam;
  homeScore: number;
  awayScore: number;
  isSuperBowl: boolean;
  spreadResult: string | null;
}

export interface ConferenceBattle {
  season: number;
  afcWins: number;
  nflWins: number;
  ties: number;
}

export interface ConferenceStats {
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  winPct: string;
  superBowlWins: number;
  superBowlAppearances: number;
  homeWins: number;
  homeLosses: number;
  homeWinPct: string;
  awayWins: number;
  awayLosses: number;
  awayWinPct: string;
  atsWins: number;
  atsTotal: number;
  atsPct: string;
  avgHomeScore: string;
  avgAwayScore: string;
}

export interface ConferenceComparisonResult {
  afcStats: ConferenceStats;
  nflStats: ConferenceStats;
  crossConferenceGames: number;
  superBowlStats: {
    afcWins: number;
    nflWins: number;
  };
  seasonComparisons: ConferenceBattle[];
}

export function computeConferenceComparison(
  games: ConferenceGame[]
): ConferenceComparisonResult {
  if (games.length === 0) {
    return {
      afcStats: {
        totalWins: 0,
        totalLosses: 0,
        totalTies: 0,
        winPct: ".000",
        superBowlWins: 0,
        superBowlAppearances: 0,
        homeWins: 0,
        homeLosses: 0,
        homeWinPct: ".000",
        awayWins: 0,
        awayLosses: 0,
        awayWinPct: ".000",
        atsWins: 0,
        atsTotal: 0,
        atsPct: ".000",
        avgHomeScore: "0.0",
        avgAwayScore: "0.0",
      },
      nflStats: {
        totalWins: 0,
        totalLosses: 0,
        totalTies: 0,
        winPct: ".000",
        superBowlWins: 0,
        superBowlAppearances: 0,
        homeWins: 0,
        homeLosses: 0,
        homeWinPct: ".000",
        awayWins: 0,
        awayLosses: 0,
        awayWinPct: ".000",
        atsWins: 0,
        atsTotal: 0,
        atsPct: ".000",
        avgHomeScore: "0.0",
        avgAwayScore: "0.0",
      },
      crossConferenceGames: 0,
      superBowlStats: { afcWins: 0, nflWins: 0 },
      seasonComparisons: [],
    };
  }

  // AFC stats
  let afcWins = 0,
    afcLosses = 0,
    afcTies = 0;
  let afcHomeWins = 0,
    afcHomeLosses = 0;
  let afcAwayWins = 0,
    afcAwayLosses = 0;
  let afcAtsWins = 0,
    afcAtsTotal = 0;
  let afcHomeScoreSum = 0,
    afcAwayScoreSum = 0;
  let afcSuperBowlWins = 0,
    afcSuperBowlApps = 0;

  // NFC stats
  let nflWins = 0;
  const nflLosses = 0;
  let nflTies = 0;
  let nflHomeWins = 0,
    nflHomeLosses = 0;
  let nflAwayWins = 0,
    nflAwayLosses = 0;
  let nflAtsWins = 0,
    nflAtsTotal = 0;
  let nflHomeScoreSum = 0,
    nflAwayScoreSum = 0;
  let nflSuperBowlWins = 0,
    nflSuperBowlApps = 0;

  // Cross-conference games
  let crossConfGames = 0;

  // Season map
  const seasonMap = new Map<number, { afcWins: number; nflWins: number; ties: number }>();

  for (const g of games) {
    const homeConf = g.homeTeam.conference;
    const awayConf = g.awayTeam.conference;
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;
    const isCrossConf = homeConf !== awayConf;

    // Only process cross-conference games for head-to-head records
    if (!isCrossConf) continue;

    crossConfGames++;

    // Initialize season if needed
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { afcWins: 0, nflWins: 0, ties: 0 });
    }
    const season = seasonMap.get(g.season)!;

    // Determine AFC and NFC outcomes
    let afcTeamWon = false;
    if (homeConf === "AFC") {
      afcTeamWon = homeWon;
    } else {
      afcTeamWon = awayWon;
    }

    if (afcTeamWon) {
      afcWins++;
      season.afcWins++;
    } else if (homeWon !== awayWon) {
      // Not a tie
      if (homeConf === "AFC") {
        afcLosses++;
        nflWins++;
        season.nflWins++;
      } else {
        afcLosses++;
        nflWins++;
        season.nflWins++;
      }
    } else {
      afcTies++;
      nflTies++;
      season.ties++;
    }

    // Home/Away records by conference
    if (homeConf === "AFC") {
      if (homeWon) afcHomeWins++;
      else if (awayWon) afcHomeLosses++;

      if (awayWon) nflAwayWins++;
      else if (homeWon) nflAwayLosses++;
    } else {
      if (homeWon) nflHomeWins++;
      else if (awayWon) nflHomeLosses++;

      if (awayWon) afcAwayWins++;
      else if (homeWon) afcAwayLosses++;
    }

    // Spread record
    if (g.spreadResult) {
      if (homeConf === "AFC") {
        afcAtsTotal++;
        if (g.spreadResult === "COVERED") afcAtsWins++;
      } else {
        nflAtsTotal++;
        if (g.spreadResult === "COVERED") nflAtsWins++;
      }
    }

    // Scoring
    if (homeConf === "AFC") {
      afcHomeScoreSum += g.homeScore;
      afcAwayScoreSum += g.awayScore;
      nflHomeScoreSum += g.awayScore;
      nflAwayScoreSum += g.homeScore;
    } else {
      nflHomeScoreSum += g.homeScore;
      nflAwayScoreSum += g.awayScore;
      afcHomeScoreSum += g.awayScore;
      afcAwayScoreSum += g.homeScore;
    }

    // Super Bowl
    if (g.isSuperBowl) {
      if (homeConf === "AFC") {
        afcSuperBowlApps++;
        if (homeWon) afcSuperBowlWins++;
        else {
          nflSuperBowlApps++;
          nflSuperBowlWins++;
        }
      } else {
        nflSuperBowlApps++;
        if (homeWon) nflSuperBowlWins++;
        else {
          afcSuperBowlApps++;
          afcSuperBowlWins++;
        }
      }
    }
  }

  const afcDecisions = afcWins + afcLosses;
  const nflDecisions = nflWins + nflLosses;
  const afcHomeDecisions = afcHomeWins + afcHomeLosses;
  const afcAwayDecisions = afcAwayWins + afcAwayLosses;
  const nflHomeDecisions = nflHomeWins + nflHomeLosses;
  const nflAwayDecisions = nflAwayWins + nflAwayLosses;

  const seasonComparisons = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      afcWins: data.afcWins,
      nflWins: data.nflWins,
      ties: data.ties,
    }));

  return {
    afcStats: {
      totalWins: afcWins,
      totalLosses: afcLosses,
      totalTies: afcTies,
      winPct: afcDecisions > 0 ? (afcWins / afcDecisions).toFixed(3) : ".000",
      superBowlWins: afcSuperBowlWins,
      superBowlAppearances: afcSuperBowlApps,
      homeWins: afcHomeWins,
      homeLosses: afcHomeLosses,
      homeWinPct: afcHomeDecisions > 0 ? (afcHomeWins / afcHomeDecisions).toFixed(3) : ".000",
      awayWins: afcAwayWins,
      awayLosses: afcAwayLosses,
      awayWinPct: afcAwayDecisions > 0 ? (afcAwayWins / afcAwayDecisions).toFixed(3) : ".000",
      atsWins: afcAtsWins,
      atsTotal: afcAtsTotal,
      atsPct: afcAtsTotal > 0 ? (afcAtsWins / afcAtsTotal).toFixed(3) : ".000",
      avgHomeScore: crossConfGames > 0 ? (afcHomeScoreSum / crossConfGames).toFixed(1) : "0.0",
      avgAwayScore: crossConfGames > 0 ? (afcAwayScoreSum / crossConfGames).toFixed(1) : "0.0",
    },
    nflStats: {
      totalWins: nflWins,
      totalLosses: nflLosses,
      totalTies: nflTies,
      winPct: nflDecisions > 0 ? (nflWins / nflDecisions).toFixed(3) : ".000",
      superBowlWins: nflSuperBowlWins,
      superBowlAppearances: nflSuperBowlApps,
      homeWins: nflHomeWins,
      homeLosses: nflHomeLosses,
      homeWinPct: nflHomeDecisions > 0 ? (nflHomeWins / nflHomeDecisions).toFixed(3) : ".000",
      awayWins: nflAwayWins,
      awayLosses: nflAwayLosses,
      awayWinPct: nflAwayDecisions > 0 ? (nflAwayWins / nflAwayDecisions).toFixed(3) : ".000",
      atsWins: nflAtsWins,
      atsTotal: nflAtsTotal,
      atsPct: nflAtsTotal > 0 ? (nflAtsWins / nflAtsTotal).toFixed(3) : ".000",
      avgHomeScore: crossConfGames > 0 ? (nflHomeScoreSum / crossConfGames).toFixed(1) : "0.0",
      avgAwayScore: crossConfGames > 0 ? (nflAwayScoreSum / crossConfGames).toFixed(1) : "0.0",
    },
    crossConferenceGames: crossConfGames,
    superBowlStats: {
      afcWins: afcSuperBowlWins,
      nflWins: nflSuperBowlWins,
    },
    seasonComparisons,
  };
}
