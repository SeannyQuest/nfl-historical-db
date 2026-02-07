/**
 * Pure ATS (Against The Spread) leaderboard — no DB dependency.
 */

export interface ATSGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  spreadResult: string | null;
  homeSide: "home" | "away" | null;
}

export interface ATSRecord {
  team: string;
  wins: number;
  losses: number;
  pushes: number;
  winPct: string;
}

export interface ATSSeason {
  season: number;
  records: ATSRecord[];
}

export interface ATSHomeAway {
  team: string;
  homeATS: string;
  awayATS: string;
  homeWins: number;
  homeLosses: number;
  awayWins: number;
  awayLosses: number;
}

export interface ATSStats {
  totalGames: number;
  overallLeaderboard: ATSRecord[];
  bestATS: ATSRecord[];
  worstATS: ATSRecord[];
  homeAwayATS: ATSHomeAway[];
}

export interface ATSResult {
  stats: ATSStats;
}

export function computeAtsLeaderboard(games: ATSGame[]): ATSResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        overallLeaderboard: [],
        bestATS: [],
        worstATS: [],
        homeAwayATS: [],
      },
    };
  }

  // Build team ATS records
  const teamATSMap = new Map<
    string,
    { wins: number; losses: number; pushes: number }
  >();
  const teamHomeAwayMap = new Map<
    string,
    {
      homeWins: number;
      homeLosses: number;
      awayWins: number;
      awayLosses: number;
    }
  >();

  for (const g of games) {
    if (g.spreadResult === null) continue;

    const homeEntry = teamATSMap.get(g.homeTeamName) || { wins: 0, losses: 0, pushes: 0 };
    const awayEntry = teamATSMap.get(g.awayTeamName) || { wins: 0, losses: 0, pushes: 0 };

    const homeHAEntry = teamHomeAwayMap.get(g.homeTeamName) || {
      homeWins: 0,
      homeLosses: 0,
      awayWins: 0,
      awayLosses: 0,
    };
    const awayHAEntry = teamHomeAwayMap.get(g.awayTeamName) || {
      homeWins: 0,
      homeLosses: 0,
      awayWins: 0,
      awayLosses: 0,
    };

    if (g.spreadResult === "PUSH") {
      homeEntry.pushes++;
      awayEntry.pushes++;
    } else if (g.spreadResult === "COVERED") {
      if (
        (g.homeSide === "home" && g.homeScore > g.awayScore) ||
        (g.homeSide === "away" && g.awayScore > g.homeScore)
      ) {
        homeEntry.wins++;
        awayEntry.losses++;
        homeHAEntry.homeWins++;
        awayHAEntry.awayLosses++;
      } else {
        homeEntry.losses++;
        awayEntry.wins++;
        homeHAEntry.homeLosses++;
        awayHAEntry.awayWins++;
      }
    } else {
      // LOST
      if (
        (g.homeSide === "home" && g.homeScore <= g.awayScore) ||
        (g.homeSide === "away" && g.awayScore <= g.homeScore)
      ) {
        homeEntry.losses++;
        awayEntry.wins++;
        homeHAEntry.homeLosses++;
        awayHAEntry.awayWins++;
      } else {
        homeEntry.wins++;
        awayEntry.losses++;
        homeHAEntry.homeWins++;
        awayHAEntry.awayLosses++;
      }
    }

    teamATSMap.set(g.homeTeamName, homeEntry);
    teamATSMap.set(g.awayTeamName, awayEntry);
    teamHomeAwayMap.set(g.homeTeamName, homeHAEntry);
    teamHomeAwayMap.set(g.awayTeamName, awayHAEntry);
  }

  const overallLeaderboard: ATSRecord[] = [...teamATSMap.entries()]
    .map(([team, record]) => {
      const decisions = record.wins + record.losses;
      return {
        team,
        wins: record.wins,
        losses: record.losses,
        pushes: record.pushes,
        winPct: decisions > 0 ? (record.wins / decisions).toFixed(3) : ".000",
      };
    })
    .sort((a, b) => {
      const aPct = parseFloat(a.winPct);
      const bPct = parseFloat(b.winPct);
      return bPct - aPct;
    });

  const bestATS = overallLeaderboard.slice(0, 10);
  const worstATS = [...overallLeaderboard].reverse().slice(0, 10);

  const homeAwayATS: ATSHomeAway[] = [...teamHomeAwayMap.entries()]
    .map(([team, ha]) => {
      const homeDecisions = ha.homeWins + ha.homeLosses;
      const awayDecisions = ha.awayWins + ha.awayLosses;
      return {
        team,
        homeATS:
          homeDecisions > 0 ? (ha.homeWins / homeDecisions).toFixed(3) : ".000",
        awayATS:
          awayDecisions > 0 ? (ha.awayWins / awayDecisions).toFixed(3) : ".000",
        homeWins: ha.homeWins,
        homeLosses: ha.homeLosses,
        awayWins: ha.awayWins,
        awayLosses: ha.awayLosses,
      };
    })
    .sort(
      (a, b) =>
        parseFloat(b.homeATS) +
        parseFloat(b.awayATS) -
        (parseFloat(a.homeATS) + parseFloat(a.awayATS))
    );

  return {
    stats: {
      totalGames: games.length,
      overallLeaderboard,
      bestATS,
      worstATS,
      homeAwayATS,
    },
  };
}
