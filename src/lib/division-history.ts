/**
 * Pure division history computation — no DB dependency.
 * Analyzes division winners, dominance, and intra-division records.
 */

export interface DivisionGame {
  season: number;
  homeTeamName: string;
  homeTeamDivision: string;
  awayTeamName: string;
  awayTeamDivision: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  isPlayoff: boolean;
}

export interface DivisionWinner {
  season: number;
  divisionName: string;
  winnerName: string;
  wins: number;
  losses: number;
  ties: number;
}

export interface IntraDivisionRecord {
  teamName: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
}

export interface DivisionStrength {
  season: number;
  division: string;
  avgWinPct: string;
  winPctSpread: string;
}

export interface DivisionHistoryResult {
  divisionWinners: DivisionWinner[];
  divisionDominance: Array<{ teamName: string; division: string; titles: number; seasons: string }>;
  intraDivisionRecords: IntraDivisionRecord[];
  divisionStrengthByYear: DivisionStrength[];
  mostCompetitiveDivisions: Array<{ season: number; division: string; spread: string }>;
}

export function computeDivisionHistory(games: DivisionGame[]): DivisionHistoryResult {
  if (games.length === 0) {
    return {
      divisionWinners: [],
      divisionDominance: [],
      intraDivisionRecords: [],
      divisionStrengthByYear: [],
      mostCompetitiveDivisions: [],
    };
  }

  // Filter regular season games only
  const regularSeasonGames = games.filter((g) => !g.isPlayoff);

  // Build division winners (best regular season record per division per season)
  const seasonDivisionMap = new Map<
    string,
    Map<
      string,
      {
        team: string;
        wins: number;
        losses: number;
        ties: number;
        games: number;
      }
    >
  >();

  for (const g of regularSeasonGames) {
    const seasonKey = g.season.toString();
    if (!seasonDivisionMap.has(seasonKey)) {
      seasonDivisionMap.set(seasonKey, new Map());
    }
    const divisionMap = seasonDivisionMap.get(seasonKey)!;

    // Home team
    const homeKey = `${g.homeTeamName}|${g.homeTeamDivision}`;
    if (!divisionMap.has(homeKey)) {
      divisionMap.set(homeKey, { team: g.homeTeamName, wins: 0, losses: 0, ties: 0, games: 0 });
    }
    const homeRecord = divisionMap.get(homeKey)!;
    homeRecord.games++;
    if (g.winnerName === g.homeTeamName) homeRecord.wins++;
    else if (g.winnerName === null) homeRecord.ties++;
    else homeRecord.losses++;

    // Away team
    const awayKey = `${g.awayTeamName}|${g.awayTeamDivision}`;
    if (!divisionMap.has(awayKey)) {
      divisionMap.set(awayKey, { team: g.awayTeamName, wins: 0, losses: 0, ties: 0, games: 0 });
    }
    const awayRecord = divisionMap.get(awayKey)!;
    awayRecord.games++;
    if (g.winnerName === g.awayTeamName) awayRecord.wins++;
    else if (g.winnerName === null) awayRecord.ties++;
    else awayRecord.losses++;
  }

  // Get division winners
  const divisionWinners: DivisionWinner[] = [];
  const divisionTitleMap = new Map<string, Set<number>>();

  for (const [seasonStr, divisionMap] of seasonDivisionMap.entries()) {
    const season = parseInt(seasonStr, 10);
    const divisionWinnerMap = new Map<string, { team: string; wins: number; losses: number; ties: number }>();

    for (const [key, record] of divisionMap.entries()) {
      const [, division] = key.split("|");
      if (!divisionWinnerMap.has(division)) {
        divisionWinnerMap.set(division, { team: record.team, wins: record.wins, losses: record.losses, ties: record.ties });
      } else {
        const current = divisionWinnerMap.get(division)!;
        const currentWinPct = current.wins / (current.wins + current.losses + current.ties);
        const recordWinPct = record.wins / (record.wins + record.losses + record.ties);
        if (recordWinPct > currentWinPct || (recordWinPct === currentWinPct && record.wins > current.wins)) {
          divisionWinnerMap.set(division, { team: record.team, wins: record.wins, losses: record.losses, ties: record.ties });
        }
      }
    }

    for (const [division, winner] of divisionWinnerMap.entries()) {
      divisionWinners.push({
        season,
        divisionName: division,
        winnerName: winner.team,
        wins: winner.wins,
        losses: winner.losses,
        ties: winner.ties,
      });

      if (!divisionTitleMap.has(`${winner.team}|${division}`)) {
        divisionTitleMap.set(`${winner.team}|${division}`, new Set());
      }
      divisionTitleMap.get(`${winner.team}|${division}`)!.add(season);
    }
  }

  // Division dominance
  const divisionDominance = [...divisionTitleMap.entries()]
    .map(([key, seasons]) => {
      const [team, division] = key.split("|");
      const sorted = [...seasons].sort();
      return {
        teamName: team,
        division,
        titles: seasons.size,
        seasons: `${sorted[0]}-${sorted[sorted.length - 1]}`,
      };
    })
    .sort((a, b) => b.titles - a.titles)
    .slice(0, 15);

  // Intra-division records
  const intraDivisionMap = new Map<string, { wins: number; losses: number; ties: number; division: string }>();

  for (const g of games) {
    if (g.homeTeamDivision !== g.awayTeamDivision || g.isPlayoff) continue; // Only intra-division games

    const homeKey = g.homeTeamName;
    const awayKey = g.awayTeamName;

    if (!intraDivisionMap.has(homeKey)) {
      intraDivisionMap.set(homeKey, { wins: 0, losses: 0, ties: 0, division: g.homeTeamDivision });
    }
    if (!intraDivisionMap.has(awayKey)) {
      intraDivisionMap.set(awayKey, { wins: 0, losses: 0, ties: 0, division: g.awayTeamDivision });
    }

    const homeRecord = intraDivisionMap.get(homeKey)!;
    const awayRecord = intraDivisionMap.get(awayKey)!;

    if (g.winnerName === g.homeTeamName) {
      homeRecord.wins++;
      awayRecord.losses++;
    } else if (g.winnerName === g.awayTeamName) {
      awayRecord.wins++;
      homeRecord.losses++;
    } else {
      homeRecord.ties++;
      awayRecord.ties++;
    }
  }

  const intraDivisionRecords: IntraDivisionRecord[] = [...intraDivisionMap.entries()]
    .map(([team, record]) => {
      const total = record.wins + record.losses + record.ties;
      const pct = total > 0 ? (record.wins / total).toFixed(3) : ".000";
      return {
        teamName: team,
        division: record.division,
        wins: record.wins,
        losses: record.losses,
        ties: record.ties,
        pct,
      };
    })
    .sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct))
    .slice(0, 20);

  // Division strength by year
  const divisionStrengthMap = new Map<
    string,
    Map<string, { wins: number; losses: number; ties: number; count: number }>
  >();

  for (const g of regularSeasonGames) {
    const seasonKey = g.season.toString();
    if (!divisionStrengthMap.has(seasonKey)) {
      divisionStrengthMap.set(seasonKey, new Map());
    }
    const divisionMap = divisionStrengthMap.get(seasonKey)!;

    if (!divisionMap.has(g.homeTeamDivision)) {
      divisionMap.set(g.homeTeamDivision, { wins: 0, losses: 0, ties: 0, count: 0 });
    }
    const homeDiv = divisionMap.get(g.homeTeamDivision)!;
    homeDiv.count++;
    if (g.winnerName === g.homeTeamName) homeDiv.wins++;
    else if (g.winnerName === null) homeDiv.ties++;
    else homeDiv.losses++;

    if (!divisionMap.has(g.awayTeamDivision)) {
      divisionMap.set(g.awayTeamDivision, { wins: 0, losses: 0, ties: 0, count: 0 });
    }
    const awayDiv = divisionMap.get(g.awayTeamDivision)!;
    awayDiv.count++;
    if (g.winnerName === g.awayTeamName) awayDiv.wins++;
    else if (g.winnerName === null) awayDiv.ties++;
    else awayDiv.losses++;
  }

  const divisionStrengthByYear: DivisionStrength[] = [];
  for (const [seasonStr, divisionMap] of divisionStrengthMap.entries()) {
    const season = parseInt(seasonStr, 10);
    const winPcts: number[] = [];

    for (const [division, record] of divisionMap.entries()) {
      const pct = (record.wins / record.count).toFixed(3);
      divisionStrengthByYear.push({
        season,
        division,
        avgWinPct: pct,
        winPctSpread: "0.0", // Will calculate below
      });
      winPcts.push(parseFloat(pct));
    }

    if (winPcts.length > 0) {
      const max = Math.max(...winPcts);
      const min = Math.min(...winPcts);
      const spread = (max - min).toFixed(3);
      for (let i = divisionStrengthByYear.length - divisionMap.size; i < divisionStrengthByYear.length; i++) {
        divisionStrengthByYear[i].winPctSpread = spread;
      }
    }
  }

  // Most competitive divisions
  const mostCompetitive = [...new Map(divisionStrengthByYear.map((d) => [`${d.season}-${d.division}`, d])).values()]
    .sort((a, b) => parseFloat(a.winPctSpread) - parseFloat(b.winPctSpread))
    .slice(0, 10)
    .map((d) => ({
      season: d.season,
      division: d.division,
      spread: d.winPctSpread,
    }));

  return {
    divisionWinners,
    divisionDominance,
    intraDivisionRecords,
    divisionStrengthByYear,
    mostCompetitiveDivisions: mostCompetitive,
  };
}
