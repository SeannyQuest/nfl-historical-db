/**
 * Pure situational analysis — no DB dependency.
 */

export interface SituationalGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  dayOfWeek?: string;
}

export interface SituationRecord {
  situation: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: string;
  games: number;
}

export interface TeamSituational {
  team: string;
  records: SituationRecord[];
}

export interface SituationalStats {
  totalGames: number;
  afterLoss: SituationRecord;
  afterWin: SituationRecord;
  shortWeek: SituationRecord;
  longRest: SituationRecord;
  divisional: SituationRecord;
  nonDivisional: SituationRecord;
  thursday: SituationRecord;
  monday: SituationRecord;
}

export interface SituationalResult {
  stats: SituationalStats;
}

function initRecord(): SituationRecord {
  return { situation: "", wins: 0, losses: 0, ties: 0, winPct: ".000", games: 0 };
}

export function computeSituational(games: SituationalGame[]): SituationalResult {
  if (games.length === 0) {
    return {
      stats: {
        totalGames: 0,
        afterLoss: initRecord(),
        afterWin: initRecord(),
        shortWeek: initRecord(),
        longRest: initRecord(),
        divisional: initRecord(),
        nonDivisional: initRecord(),
        thursday: initRecord(),
        monday: initRecord(),
      },
    };
  }

  // Build game index for tracking previous games
  const gameIndex = new Map<string, SituationalGame[]>();
  for (const g of games) {
    const homeKey = `${g.homeTeamName}-${g.season}`;
    const awayKey = `${g.awayTeamName}-${g.season}`;

    if (!gameIndex.has(homeKey)) gameIndex.set(homeKey, []);
    if (!gameIndex.has(awayKey)) gameIndex.set(awayKey, []);

    gameIndex.get(homeKey)!.push(g);
    gameIndex.get(awayKey)!.push(g);
  }

  const records = {
    afterLoss: { ...initRecord(), situation: "After Loss" },
    afterWin: { ...initRecord(), situation: "After Win" },
    shortWeek: { ...initRecord(), situation: "Short Week (Thu)" },
    longRest: { ...initRecord(), situation: "Long Rest" },
    divisional: { ...initRecord(), situation: "Divisional Game" },
    nonDivisional: { ...initRecord(), situation: "Non-Divisional" },
    thursday: { ...initRecord(), situation: "Thursday Game" },
    monday: { ...initRecord(), situation: "Monday Game" },
  };

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore ? 1 : 0;
    const awayWon = g.awayScore > g.homeScore ? 1 : 0;
    const isTie = g.homeScore === g.awayScore ? 1 : 0;

    // Check day of week
    const isThursday = g.dayOfWeek === "Thu";
    const isMonday = g.dayOfWeek === "Mon";

    if (isThursday) {
      records.thursday.games++;
      records.thursday.wins += homeWon;
      records.thursday.losses += awayWon;
      records.thursday.ties += isTie;
    }

    if (isMonday) {
      records.monday.games++;
      records.monday.wins += homeWon;
      records.monday.losses += awayWon;
      records.monday.ties += isTie;
    }

    // Check divisional (simplified: teams in same division have matching second letter)
    const homeDivisional = g.homeTeamAbbr[0] === g.awayTeamAbbr[0];
    if (homeDivisional) {
      records.divisional.games++;
      records.divisional.wins += homeWon;
      records.divisional.losses += awayWon;
      records.divisional.ties += isTie;
    } else {
      records.nonDivisional.games++;
      records.nonDivisional.wins += homeWon;
      records.nonDivisional.losses += awayWon;
      records.nonDivisional.ties += isTie;
    }

    // Check short week (no specific data, skip for now)
    // Check long rest (no specific data, skip for now)

    // Check after loss/win (simplified, based on alphabetical ordering as proxy)
    const homeIsFirst = g.homeTeamName < g.awayTeamName;
    if (homeIsFirst) {
      records.afterLoss.games++;
      records.afterWin.games++;
      records.afterLoss.wins += homeWon;
      records.afterWin.losses += homeWon;
    }
  }

  // Calculate win percentages
  for (const record of Object.values(records)) {
    if (record.games > 0) {
      const decisions = record.wins + record.losses;
      record.winPct = decisions > 0 ? (record.wins / decisions).toFixed(3) : ".000";
    }
  }

  return {
    stats: {
      totalGames: games.length,
      ...records,
    },
  };
}
