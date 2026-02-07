/**
 * Pure era comparison computation — no DB dependency.
 * Compares NFL eras based on game statistics and trends.
 */

export interface EraGame {
  season: number;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  homeTeamName: string;
  awayTeamName: string;
  winnerName: string | null;
  spread: number | null;
  spreadResult: string | null;
  ouResult: string | null;
  overUnder: number | null;
}

export interface EraStats {
  era: string;
  years: string;
  totalGames: number;
  avgScoringTotal: string;
  avgHomeScore: string;
  avgAwayScore: string;
  homeWinPct: string;
  overPct: string;
  avgSpread: string;
  homeCoverPct: string;
}

export interface NotableRecord {
  season: number;
  team: string;
  stat: string;
  value: number;
}

export interface EraComparisonResult {
  eras: EraStats[];
  highestScoringEra: { era: string; avg: string };
  lowestScoringEra: { era: string; avg: string };
  highestHomeWinRateEra: { era: string; pct: string };
  notableRecords: NotableRecord[];
}

const ERA_DEFINITIONS: Record<string, { startYear: number; endYear: number }> = {
  "Pre-Merger": { startYear: 1966, endYear: 1969 },
  "Early Modern": { startYear: 1970, endYear: 1989 },
  "Salary Cap Era": { startYear: 1994, endYear: 2009 },
  "Modern Era": { startYear: 2010, endYear: 2100 },
};

function getEraForSeason(season: number): string | null {
  for (const [era, { startYear, endYear }] of Object.entries(ERA_DEFINITIONS)) {
    if (season >= startYear && season <= endYear) {
      return era;
    }
  }
  return null;
}

export function computeEraComparison(games: EraGame[]): EraComparisonResult {
  if (games.length === 0) {
    return {
      eras: [],
      highestScoringEra: { era: "N/A", avg: "0.0" },
      lowestScoringEra: { era: "N/A", avg: "0.0" },
      highestHomeWinRateEra: { era: "N/A", pct: ".000" },
      notableRecords: [],
    };
  }

  const eraMap = new Map<
    string,
    {
      games: number;
      totalPoints: number;
      homeScoreSum: number;
      awayScoreSum: number;
      homeWins: number;
      decisions: number;
      overs: number;
      ouTotal: number;
      homeCovered: number;
      homeSpreadLost: number;
      spreadPushes: number;
      spreadTotal: number;
      spreadsSum: number;
      spreadsCount: number;
    }
  >();

  // Team season records for notable records
  const teamSeasonMap = new Map<
    string,
    {
      wins: number;
      losses: number;
      ties: number;
      totalScore: number;
      gamesPlayed: number;
    }
  >();

  for (const g of games) {
    const era = getEraForSeason(g.season);
    if (!era) continue;

    if (!eraMap.has(era)) {
      eraMap.set(era, {
        games: 0,
        totalPoints: 0,
        homeScoreSum: 0,
        awayScoreSum: 0,
        homeWins: 0,
        decisions: 0,
        overs: 0,
        ouTotal: 0,
        homeCovered: 0,
        homeSpreadLost: 0,
        spreadPushes: 0,
        spreadTotal: 0,
        spreadsSum: 0,
        spreadsCount: 0,
      });
    }

    const eraData = eraMap.get(era)!;
    const total = g.homeScore + g.awayScore;
    eraData.games++;
    eraData.totalPoints += total;
    eraData.homeScoreSum += g.homeScore;
    eraData.awayScoreSum += g.awayScore;

    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (homeWon || awayWon) {
      eraData.decisions++;
      if (homeWon) eraData.homeWins++;
    }

    if (g.ouResult === "OVER") {
      eraData.overs++;
      eraData.ouTotal++;
    } else if (g.ouResult === "UNDER") {
      eraData.ouTotal++;
    } else if (g.ouResult === "PUSH") {
      eraData.ouTotal++;
    }

    if (g.spreadResult === "COVERED") eraData.homeCovered++;
    else if (g.spreadResult === "LOST") eraData.homeSpreadLost++;
    else if (g.spreadResult === "PUSH") eraData.spreadPushes++;

    if (g.spreadResult) eraData.spreadTotal++;
    if (g.spread !== null) {
      eraData.spreadsSum += g.spread;
      eraData.spreadsCount++;
    }

    // Team season records
    if (!g.isPlayoff) {
      const homeKey = `${g.homeTeamName}|${g.season}`;
      const awayKey = `${g.awayTeamName}|${g.season}`;

      if (!teamSeasonMap.has(homeKey)) {
        teamSeasonMap.set(homeKey, { wins: 0, losses: 0, ties: 0, totalScore: 0, gamesPlayed: 0 });
      }
      if (!teamSeasonMap.has(awayKey)) {
        teamSeasonMap.set(awayKey, { wins: 0, losses: 0, ties: 0, totalScore: 0, gamesPlayed: 0 });
      }

      const home = teamSeasonMap.get(homeKey)!;
      const away = teamSeasonMap.get(awayKey)!;

      home.gamesPlayed++;
      away.gamesPlayed++;
      home.totalScore += g.homeScore;
      away.totalScore += g.awayScore;

      if (homeWon) {
        home.wins++;
        away.losses++;
      } else if (awayWon) {
        away.wins++;
        home.losses++;
      } else {
        home.ties++;
        away.ties++;
      }
    }
  }

  const eras: EraStats[] = [];
  let highestAvg = 0;
  let highestEra = "";
  let lowestAvg = Infinity;
  let lowestEra = "";
  let highestWinPct = 0;
  let highestWinEra = "";

  for (const [era, data] of eraMap.entries()) {
    const avgTotal = data.games > 0 ? (data.totalPoints / data.games).toFixed(1) : "0.0";
    const avgHome = data.games > 0 ? (data.homeScoreSum / data.games).toFixed(1) : "0.0";
    const avgAway = data.games > 0 ? (data.awayScoreSum / data.games).toFixed(1) : "0.0";
    const homeWinPct = data.decisions > 0 ? (data.homeWins / data.decisions).toFixed(3) : ".000";
    const overPct = data.ouTotal > 0 ? (data.overs / data.ouTotal).toFixed(3) : ".000";
    const avgSpread = data.spreadsCount > 0 ? (data.spreadsSum / data.spreadsCount).toFixed(1) : "0.0";
    const homeCoverPct = data.spreadTotal > 0 ? (data.homeCovered / data.spreadTotal).toFixed(3) : ".000";

    const years =
      era === "Pre-Merger"
        ? "1966-1969"
        : era === "Early Modern"
          ? "1970-1989"
          : era === "Salary Cap Era"
            ? "1994-2009"
            : "2010+";

    eras.push({
      era,
      years,
      totalGames: data.games,
      avgScoringTotal: avgTotal,
      avgHomeScore: avgHome,
      avgAwayScore: avgAway,
      homeWinPct,
      overPct,
      avgSpread,
      homeCoverPct,
    });

    const avgNum = parseFloat(avgTotal);
    if (avgNum > highestAvg) {
      highestAvg = avgNum;
      highestEra = era;
    }
    if (avgNum < lowestAvg) {
      lowestAvg = avgNum;
      lowestEra = era;
    }

    const winPctNum = parseFloat(homeWinPct);
    if (winPctNum > highestWinPct) {
      highestWinPct = winPctNum;
      highestWinEra = era;
    }
  }

  // Get notable records (best win% seasons)
  const notableRecords: NotableRecord[] = [...teamSeasonMap.entries()]
    .filter(([, data]) => data.gamesPlayed >= 10)
    .sort((a, b) => {
      const aPct = a[1].wins / a[1].gamesPlayed;
      const bPct = b[1].wins / b[1].gamesPlayed;
      return bPct - aPct;
    })
    .slice(0, 5)
    .map(([key, data]) => {
      const [team, seasonStr] = key.split("|");
      const season = parseInt(seasonStr, 10);
      const winPct = (data.wins / data.gamesPlayed).toFixed(3);
      return {
        season,
        team,
        stat: `${data.wins}-${data.losses}${data.ties > 0 ? `-${data.ties}` : ""} (${winPct})`,
        value: data.wins,
      };
    });

  return {
    eras,
    highestScoringEra: { era: highestEra, avg: highestAvg.toFixed(1) },
    lowestScoringEra: { era: lowestEra, avg: lowestAvg === Infinity ? "0.0" : lowestAvg.toFixed(1) },
    highestHomeWinRateEra: { era: highestWinEra, pct: highestWinPct.toFixed(3) },
    notableRecords,
  };
}
