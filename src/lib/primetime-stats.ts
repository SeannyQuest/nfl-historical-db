/**
 * Pure primetime performance computation — no DB dependency.
 * Analyzes NFL games by primetime slot (MNF, SNF, TNF).
 */

export interface PrimetimeGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  primetime: string | null;
  isPlayoff: boolean;
  spread: number | null;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface TeamPrimetimeRecord {
  teamName: string;
  slot: string;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
  games: number;
}

export interface PrimetimeSlotStats {
  slot: string;
  totalGames: number;
  avgHomeScore: string;
  avgAwayScore: string;
  homeWinPct: string;
  homeWins: number;
  awayWins: number;
  upsetRate: string;
  homeCoverPct: string;
  overPct: string;
}

export interface PrimetimeVsNonPrimetime {
  primetime: { avgTotal: string; homeWinPct: string; avgSpread: string };
  nonPrimetime: { avgTotal: string; homeWinPct: string; avgSpread: string };
}

export interface PrimetimeStatsResult {
  slots: PrimetimeSlotStats[];
  bestPrimetimeTeam: { teamName: string; slot: string; winPct: string; games: number } | null;
  worstPrimetimeTeam: { teamName: string; slot: string; winPct: string; games: number } | null;
  primetimeVsNonPrimetime: PrimetimeVsNonPrimetime;
  biggestBlowouts: Array<{ score: string; margin: number; teams: string; slot: string }>;
  upsets: Array<{ teams: string; score: string; slot: string; season: number }>;
}

export function computePrimetimeStats(games: PrimetimeGame[]): PrimetimeStatsResult {
  if (games.length === 0) {
    return {
      slots: [],
      bestPrimetimeTeam: null,
      worstPrimetimeTeam: null,
      primetimeVsNonPrimetime: {
        primetime: { avgTotal: "0.0", homeWinPct: ".000", avgSpread: "0.0" },
        nonPrimetime: { avgTotal: "0.0", homeWinPct: ".000", avgSpread: "0.0" },
      },
      biggestBlowouts: [],
      upsets: [],
    };
  }

  const slotMap = new Map<
    string,
    {
      games: number;
      homeScoreSum: number;
      awayScoreSum: number;
      homeWins: number;
      awayWins: number;
      ties: number;
      upsets: number;
      homeCovered: number;
      spreadTotal: number;
      overs: number;
      ouTotal: number;
    }
  >();

  const teamSlotMap = new Map<string, { wins: number; losses: number; ties: number }>();

  let primetimeTotal = 0,
    primetimeHomeScores = 0,
    primetimeAwayScores = 0,
    primetimeHomeWins = 0,
    primetimeDecisions = 0,
    primetimeSpreadSum = 0,
    primetimeSpreadCount = 0;
  let nonprimetimeTotal = 0,
    nonprimetimeHomeScores = 0,
    nonprimetimeAwayScores = 0,
    nonprimetimeHomeWins = 0,
    nonprimetimeDecisions = 0,
    nonprimetimeSpreadSum = 0,
    nonprimetimeSpreadCount = 0;

  const blowouts: Array<{ score: string; margin: number; teams: string; slot: string; season: number }> = [];
  const upsetList: Array<{ teams: string; score: string; slot: string; season: number }> = [];

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    const slot = g.primetime ?? "Regular";
    if (!slotMap.has(slot)) {
      slotMap.set(slot, {
        games: 0,
        homeScoreSum: 0,
        awayScoreSum: 0,
        homeWins: 0,
        awayWins: 0,
        ties: 0,
        upsets: 0,
        homeCovered: 0,
        spreadTotal: 0,
        overs: 0,
        ouTotal: 0,
      });
    }

    const slotData = slotMap.get(slot)!;
    slotData.games++;
    slotData.homeScoreSum += g.homeScore;
    slotData.awayScoreSum += g.awayScore;

    if (homeWon) slotData.homeWins++;
    else if (awayWon) slotData.awayWins++;
    else slotData.ties++;

    if (g.spreadResult === "COVERED") slotData.homeCovered++;
    if (g.spreadResult) slotData.spreadTotal++;
    if (g.ouResult === "OVER") slotData.overs++;
    if (g.ouResult) slotData.ouTotal++;

    // Track team records by slot (primetime games only)
    if (g.primetime) {
      const homeKey = `${g.homeTeamName}|${g.primetime}`;
      const awayKey = `${g.awayTeamName}|${g.primetime}`;

      if (!teamSlotMap.has(homeKey)) teamSlotMap.set(homeKey, { wins: 0, losses: 0, ties: 0 });
      if (!teamSlotMap.has(awayKey)) teamSlotMap.set(awayKey, { wins: 0, losses: 0, ties: 0 });

      const homeRecord = teamSlotMap.get(homeKey)!;
      const awayRecord = teamSlotMap.get(awayKey)!;

      if (homeWon) {
        homeRecord.wins++;
        awayRecord.losses++;
      } else if (awayWon) {
        awayRecord.wins++;
        homeRecord.losses++;
      } else {
        homeRecord.ties++;
        awayRecord.ties++;
      }
    }

    // Primetime vs non-primetime comparison
    const isPrimetime = Boolean(g.primetime);
    const total = g.homeScore + g.awayScore;

    if (isPrimetime) {
      primetimeTotal += total;
      primetimeHomeScores += g.homeScore;
      primetimeAwayScores += g.awayScore;
      if (homeWon || awayWon) primetimeDecisions++;
      if (homeWon) primetimeHomeWins++;
      if (g.spread !== null) {
        primetimeSpreadSum += g.spread;
        primetimeSpreadCount++;
      }
    } else {
      nonprimetimeTotal += total;
      nonprimetimeHomeScores += g.homeScore;
      nonprimetimeAwayScores += g.awayScore;
      if (homeWon || awayWon) nonprimetimeDecisions++;
      if (homeWon) nonprimetimeHomeWins++;
      if (g.spread !== null) {
        nonprimetimeSpreadSum += g.spread;
        nonprimetimeSpreadCount++;
      }
    }

    // Blowouts (margin >= 14)
    const margin = Math.abs(g.homeScore - g.awayScore);
    if (margin >= 14) {
      blowouts.push({
        score: `${g.awayScore}-${g.homeScore}`,
        margin,
        teams: `${g.awayTeamName} @ ${g.homeTeamName}`,
        slot,
        season: g.season,
      });
    }

    // Upsets (away team wins when spread favors home, or home wins when spread favors away)
    if (g.spread !== null && awayWon && g.spread > 0) {
      slotData.upsets++;
      upsetList.push({
        teams: `${g.awayTeamName} @ ${g.homeTeamName}`,
        score: `${g.awayScore}-${g.homeScore}`,
        slot,
        season: g.season,
      });
    } else if (g.spread !== null && homeWon && g.spread < 0) {
      slotData.upsets++;
      upsetList.push({
        teams: `${g.awayTeamName} @ ${g.homeTeamName}`,
        score: `${g.awayScore}-${g.homeScore}`,
        slot,
        season: g.season,
      });
    }
  }

  // Calculate slot statistics
  const slots: PrimetimeSlotStats[] = [...slotMap.entries()]
    .map(([slot, data]) => {
      const homeWinPct = data.homeWins + data.awayWins > 0 ? (data.homeWins / (data.homeWins + data.awayWins)).toFixed(3) : ".000";
      const upsetRate = data.games > 0 ? (data.upsets / data.games).toFixed(3) : ".000";
      const homeCoverPct = data.spreadTotal > 0 ? (data.homeCovered / data.spreadTotal).toFixed(3) : ".000";
      const overPct = data.ouTotal > 0 ? (data.overs / data.ouTotal).toFixed(3) : ".000";

      return {
        slot,
        totalGames: data.games,
        avgHomeScore: (data.homeScoreSum / data.games).toFixed(1),
        avgAwayScore: (data.awayScoreSum / data.games).toFixed(1),
        homeWinPct,
        homeWins: data.homeWins,
        awayWins: data.awayWins,
        upsetRate,
        homeCoverPct,
        overPct,
      };
    })
    .sort((a, b) => b.totalGames - a.totalGames);

  // Find best and worst primetime teams
  const teamRecords = [...teamSlotMap.entries()]
    .map(([key, record]) => {
      const [team, slot] = key.split("|");
      const total = record.wins + record.losses + record.ties;
      const pct = total > 0 ? (record.wins / total).toFixed(3) : ".000";
      return { teamName: team, slot, wins: record.wins, losses: record.losses, ties: record.ties, pct, games: total };
    })
    .filter((r) => r.games >= 3); // Minimum 3 games

  const bestTeam = teamRecords.length > 0 ? [...teamRecords].sort((a, b) => {
    const aPct = parseFloat(a.pct);
    const bPct = parseFloat(b.pct);
    if (bPct !== aPct) return bPct - aPct;
    return b.games - a.games;
  })[0] : null;

  const worstTeam = teamRecords.length > 0 ? [...teamRecords].sort((a, b) => {
    const aPct = parseFloat(a.pct);
    const bPct = parseFloat(b.pct);
    if (aPct !== bPct) return aPct - bPct;
    return a.games - b.games;
  })[0] : null;

  // Count primetime games
  const primetimeGames = games.filter((g) => Boolean(g.primetime)).length;
  const nonprimetimeGames = games.length - primetimeGames;

  return {
    slots,
    bestPrimetimeTeam: bestTeam ? { teamName: bestTeam.teamName, slot: bestTeam.slot, winPct: bestTeam.pct, games: bestTeam.games } : null,
    worstPrimetimeTeam: worstTeam ? { teamName: worstTeam.teamName, slot: worstTeam.slot, winPct: worstTeam.pct, games: worstTeam.games } : null,
    primetimeVsNonPrimetime: {
      primetime: {
        avgTotal: primetimeGames > 0 ? (primetimeTotal / primetimeGames).toFixed(1) : "0.0",
        homeWinPct: primetimeDecisions > 0 ? (primetimeHomeWins / primetimeDecisions).toFixed(3) : ".000",
        avgSpread: primetimeSpreadCount > 0 ? (primetimeSpreadSum / primetimeSpreadCount).toFixed(1) : "0.0",
      },
      nonPrimetime: {
        avgTotal: nonprimetimeGames > 0 ? (nonprimetimeTotal / nonprimetimeGames).toFixed(1) : "0.0",
        homeWinPct: nonprimetimeDecisions > 0 ? (nonprimetimeHomeWins / nonprimetimeDecisions).toFixed(3) : ".000",
        avgSpread: nonprimetimeSpreadCount > 0 ? (nonprimetimeSpreadSum / nonprimetimeSpreadCount).toFixed(1) : "0.0",
      },
    },
    biggestBlowouts: blowouts.sort((a, b) => b.margin - a.margin).slice(0, 10).map((b) => ({ score: b.score, margin: b.margin, teams: b.teams, slot: b.slot })),
    upsets: upsetList.slice(0, 10),
  };
}
