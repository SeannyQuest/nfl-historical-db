/**
 * Pure team stats computation — no DB dependency.
 * Operates on arrays of game-like objects to compute records and trends.
 */

export interface GameForStats {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  season: number;
  isPlayoff: boolean;
  spreadResult: string | null; // "COVERED" | "LOST" | "PUSH" | null
  ouResult: string | null;     // "OVER" | "UNDER" | "PUSH" | null
  spread: number | null;
  overUnder: number | null;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  pct: string;
}

export interface ATSRecord {
  covered: number;
  lost: number;
  push: number;
  total: number;
  coverPct: string;
}

export interface OURecord {
  over: number;
  under: number;
  push: number;
  total: number;
}

export interface SeasonRecord {
  season: number;
  record: TeamRecord;
  ats: ATSRecord;
  pointsFor: number;
  pointsAgainst: number;
}

export interface TeamStatsResult {
  allTime: TeamRecord;
  ats: ATSRecord;
  ou: OURecord;
  homeRecord: TeamRecord;
  awayRecord: TeamRecord;
  playoffRecord: TeamRecord;
  avgPointsFor: string;
  avgPointsAgainst: string;
  seasons: SeasonRecord[];
}

function buildRecord(wins: number, losses: number, ties: number): TeamRecord {
  const total = wins + losses + ties;
  return {
    wins,
    losses,
    ties,
    pct: total > 0 ? (wins / total).toFixed(3) : ".000",
  };
}

function buildATSRecord(games: GameForStats[], teamName: string): ATSRecord {
  let covered = 0;
  let lost = 0;
  let push = 0;

  for (const g of games) {
    // Determine the spread result from the team's perspective
    const isHome = g.homeTeamName === teamName;
    const sr = g.spreadResult;
    if (!sr) continue;

    // spreadResult is from the home team perspective
    if (isHome) {
      if (sr === "COVERED") covered++;
      else if (sr === "LOST") lost++;
      else if (sr === "PUSH") push++;
    } else {
      // Away team: home COVERED means away LOST, etc.
      if (sr === "COVERED") lost++;
      else if (sr === "LOST") covered++;
      else if (sr === "PUSH") push++;
    }
  }

  const total = covered + lost + push;
  return {
    covered,
    lost,
    push,
    total,
    coverPct: total > 0 ? (covered / total).toFixed(3) : ".000",
  };
}

function buildOURecord(games: GameForStats[]): OURecord {
  let over = 0;
  let under = 0;
  let push = 0;

  for (const g of games) {
    if (!g.ouResult) continue;
    if (g.ouResult === "OVER") over++;
    else if (g.ouResult === "UNDER") under++;
    else if (g.ouResult === "PUSH") push++;
  }

  return { over, under, push, total: over + under + push };
}

export function computeTeamStats(
  games: GameForStats[],
  teamName: string
): TeamStatsResult {
  let wins = 0, losses = 0, ties = 0;
  let homeWins = 0, homeLosses = 0, homeTies = 0;
  let awayWins = 0, awayLosses = 0, awayTies = 0;
  let playoffWins = 0, playoffLosses = 0, playoffTies = 0;
  let totalPF = 0, totalPA = 0;

  const seasonMap = new Map<number, { games: GameForStats[]; wins: number; losses: number; ties: number; pf: number; pa: number }>();

  for (const g of games) {
    const isHome = g.homeTeamName === teamName;
    const pf = isHome ? g.homeScore : g.awayScore;
    const pa = isHome ? g.awayScore : g.homeScore;
    totalPF += pf;
    totalPA += pa;

    const won = g.winnerName === teamName;
    const tied = g.winnerName === null;

    if (won) wins++;
    else if (tied) ties++;
    else losses++;

    if (isHome) {
      if (won) homeWins++;
      else if (tied) homeTies++;
      else homeLosses++;
    } else {
      if (won) awayWins++;
      else if (tied) awayTies++;
      else awayLosses++;
    }

    if (g.isPlayoff) {
      if (won) playoffWins++;
      else if (tied) playoffTies++;
      else playoffLosses++;
    }

    // Season breakdown
    if (!seasonMap.has(g.season)) {
      seasonMap.set(g.season, { games: [], wins: 0, losses: 0, ties: 0, pf: 0, pa: 0 });
    }
    const s = seasonMap.get(g.season)!;
    s.games.push(g);
    s.pf += pf;
    s.pa += pa;
    if (won) s.wins++;
    else if (tied) s.ties++;
    else s.losses++;
  }

  const totalGames = games.length;
  const seasons: SeasonRecord[] = [...seasonMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([season, data]) => ({
      season,
      record: buildRecord(data.wins, data.losses, data.ties),
      ats: buildATSRecord(data.games, teamName),
      pointsFor: data.pf,
      pointsAgainst: data.pa,
    }));

  return {
    allTime: buildRecord(wins, losses, ties),
    ats: buildATSRecord(games, teamName),
    ou: buildOURecord(games),
    homeRecord: buildRecord(homeWins, homeLosses, homeTies),
    awayRecord: buildRecord(awayWins, awayLosses, awayTies),
    playoffRecord: buildRecord(playoffWins, playoffLosses, playoffTies),
    avgPointsFor: totalGames > 0 ? (totalPF / totalGames).toFixed(1) : "0.0",
    avgPointsAgainst: totalGames > 0 ? (totalPA / totalGames).toFixed(1) : "0.0",
    seasons,
  };
}
