/**
 * Pure dome vs outdoor analysis — no DB dependency.
 * isDome if conditions contains "dome" or "indoor" or temperature is null with no weather
 */

export interface VenueGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  conditions: string | null;
  temperature: number | null;
}

export interface VenueStats {
  games: number;
  avgTotal: number;
  homeWinPct: number;
  avgMargin: number;
}

export interface TeamDomeRecord {
  team: string;
  domeWins: number;
  domeLosses: number;
  outdoorWins: number;
  outdoorLosses: number;
}

export interface DomeOutdoorResult {
  domeStats: VenueStats;
  outdoorStats: VenueStats;
  coldWeatherStats: VenueStats;
  hotWeatherStats: VenueStats;
  teamDomeRecords: TeamDomeRecord[];
}

function isDomeGame(conditions: string | null, temperature: number | null): boolean {
  if (!conditions && temperature === null) return true;
  if (conditions && (conditions.toLowerCase().includes("dome") || conditions.toLowerCase().includes("indoor"))) {
    return true;
  }
  return false;
}

function computeVenueStats(games: VenueGame[]): VenueStats {
  if (games.length === 0) {
    return {
      games: 0,
      avgTotal: 0,
      homeWinPct: 0,
      avgMargin: 0,
    };
  }

  let homeWins = 0;
  let totalScores = 0;
  let totalMargins = 0;

  for (const g of games) {
    if (g.homeScore > g.awayScore) homeWins++;
    totalScores += g.homeScore + g.awayScore;
    totalMargins += Math.abs(g.homeScore - g.awayScore);
  }

  return {
    games: games.length,
    avgTotal: totalScores / games.length,
    homeWinPct: (homeWins / games.length) * 100,
    avgMargin: totalMargins / games.length,
  };
}

export function computeDomeOutdoor(games: VenueGame[]): DomeOutdoorResult {
  const domeGames: VenueGame[] = [];
  const outdoorGames: VenueGame[] = [];
  const coldGames: VenueGame[] = [];
  const hotGames: VenueGame[] = [];

  // Classify games
  for (const g of games) {
    const isDome = isDomeGame(g.conditions, g.temperature);
    if (isDome) {
      domeGames.push(g);
    } else {
      outdoorGames.push(g);
    }

    // Cold weather: temp < 40
    if (g.temperature !== null && g.temperature < 40) {
      coldGames.push(g);
    }

    // Hot weather: temp > 85
    if (g.temperature !== null && g.temperature > 85) {
      hotGames.push(g);
    }
  }

  const domeStats = computeVenueStats(domeGames);
  const outdoorStats = computeVenueStats(outdoorGames);
  const coldWeatherStats = computeVenueStats(coldGames);
  const hotWeatherStats = computeVenueStats(hotGames);

  // Build team dome/outdoor records
  const teamMap = new Map<string, { domeWins: number; domeLosses: number; outdoorWins: number; outdoorLosses: number }>();

  for (const g of games) {
    const isDome = isDomeGame(g.conditions, g.temperature);
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    const homeEntry = teamMap.get(g.homeTeamName) || { domeWins: 0, domeLosses: 0, outdoorWins: 0, outdoorLosses: 0 };
    if (isDome) {
      if (homeWon) homeEntry.domeWins++;
      else if (awayWon) homeEntry.domeLosses++;
    } else {
      if (homeWon) homeEntry.outdoorWins++;
      else if (awayWon) homeEntry.outdoorLosses++;
    }
    teamMap.set(g.homeTeamName, homeEntry);

    const awayEntry = teamMap.get(g.awayTeamName) || { domeWins: 0, domeLosses: 0, outdoorWins: 0, outdoorLosses: 0 };
    if (isDome) {
      if (awayWon) awayEntry.domeWins++;
      else if (homeWon) awayEntry.domeLosses++;
    } else {
      if (awayWon) awayEntry.outdoorWins++;
      else if (homeWon) awayEntry.outdoorLosses++;
    }
    teamMap.set(g.awayTeamName, awayEntry);
  }

  const teamDomeRecords: TeamDomeRecord[] = [...teamMap.entries()]
    .map(([team, data]) => ({
      team,
      domeWins: data.domeWins,
      domeLosses: data.domeLosses,
      outdoorWins: data.outdoorWins,
      outdoorLosses: data.outdoorLosses,
    }))
    .sort((a, b) => {
      const aWinPct = (a.domeWins + a.outdoorWins) > 0 ?
        ((a.domeWins + a.outdoorWins) / (a.domeWins + a.domeLosses + a.outdoorWins + a.outdoorLosses)) * 100 : 0;
      const bWinPct = (b.domeWins + b.outdoorWins) > 0 ?
        ((b.domeWins + b.outdoorWins) / (b.domeWins + b.domeLosses + b.outdoorWins + b.outdoorLosses)) * 100 : 0;
      return bWinPct - aWinPct;
    });

  return {
    domeStats,
    outdoorStats,
    coldWeatherStats,
    hotWeatherStats,
    teamDomeRecords,
  };
}
