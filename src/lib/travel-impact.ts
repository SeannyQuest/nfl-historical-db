/**
 * Pure travel impact analysis — no DB dependency.
 */

export interface TravelGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTimezone: string;
  awayTimezone: string;
}

export interface TimezoneAdvantage {
  travelDirection: "East to West" | "West to East" | "Same";
  games: number;
  awayWinPct: number;
}

export interface CrossCountryResult {
  games: number;
  homeWinPct: number;
  avgMargin: number;
}

export interface TeamTravelRecord {
  team: string;
  awayGames: number;
  awayWins: number;
  awayLosses: number;
  crossTimezoneRecord: string;
}

export interface TravelImpactResult {
  timezoneAdvantage: TimezoneAdvantage[];
  crossCountryResults: CrossCountryResult;
  teamTravelRecords: TeamTravelRecord[];
}

function getTravelDirection(homeTimezone: string, awayTimezone: string): "East to West" | "West to East" | "Same" {
  const tzOrder: Record<string, number> = {
    "Eastern": 3,
    "Central": 2,
    "Mountain": 1,
    "Pacific": 0,
  };

  const homeValue = tzOrder[homeTimezone] ?? 0;
  const awayValue = tzOrder[awayTimezone] ?? 0;

  if (homeValue === awayValue) return "Same";
  if (awayValue > homeValue) return "East to West";
  return "West to East";
}

export function computeTravelImpact(games: TravelGame[]): TravelImpactResult {
  if (games.length === 0) {
    return {
      timezoneAdvantage: [],
      crossCountryResults: { games: 0, homeWinPct: 0, avgMargin: 0 },
      teamTravelRecords: [],
    };
  }

  // Categorize by travel direction
  const travelMap = new Map<string, { awayWins: number; total: number }>();
  let crossCountryGames = 0;
  let crossCountryHomeWins = 0;
  const crossCountryMargins: number[] = [];

  for (const g of games) {
    const direction = getTravelDirection(g.homeTimezone, g.awayTimezone);
    const entry = travelMap.get(direction) || { awayWins: 0, total: 0 };

    entry.total++;
    const margin = Math.abs(g.homeScore - g.awayScore);

    if (g.awayScore > g.homeScore) {
      entry.awayWins++;
    }

    // Cross-country: Pacific to Eastern or Eastern to Pacific
    const isPacificToEastern =
      (g.awayTimezone === "Pacific" && g.homeTimezone === "Eastern") ||
      (g.awayTimezone === "Eastern" && g.homeTimezone === "Pacific");

    if (isPacificToEastern) {
      crossCountryGames++;
      if (g.homeScore > g.awayScore) crossCountryHomeWins++;
      crossCountryMargins.push(margin);
    }

    travelMap.set(direction, entry);
  }

  // Timezone advantage stats
  const timezoneAdvantage: TimezoneAdvantage[] = [...travelMap.entries()]
    .map(([direction, data]) => ({
      travelDirection: direction as "East to West" | "West to East" | "Same",
      games: data.total,
      awayWinPct: parseFloat(((data.awayWins / data.total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.games - a.games);

  // Cross-country results
  const crossCountryAvgMargin =
    crossCountryMargins.length > 0
      ? parseFloat((crossCountryMargins.reduce((a, b) => a + b, 0) / crossCountryMargins.length).toFixed(1))
      : 0;

  const crossCountryHomeWinPct =
    crossCountryGames > 0 ? parseFloat(((crossCountryHomeWins / crossCountryGames) * 100).toFixed(1)) : 0;

  // Team travel records
  const teamAwayMap = new Map<string, { wins: number; losses: number; crossTimezoneWins: number; crossTimezoneLosses: number }>();

  for (const g of games) {
    const awayEntry = teamAwayMap.get(g.awayTeamName) || { wins: 0, losses: 0, crossTimezoneWins: 0, crossTimezoneLosses: 0 };

    if (g.awayScore > g.homeScore) {
      awayEntry.wins++;
    } else {
      awayEntry.losses++;
    }

    // Track cross-timezone games
    if (g.homeTimezone !== g.awayTimezone) {
      if (g.awayScore > g.homeScore) {
        awayEntry.crossTimezoneWins++;
      } else {
        awayEntry.crossTimezoneLosses++;
      }
    }

    teamAwayMap.set(g.awayTeamName, awayEntry);
  }

  const teamTravelRecords: TeamTravelRecord[] = [...teamAwayMap.entries()]
    .map(([team, data]) => {
      const totalAway = data.wins + data.losses;
      const crossTimezoneTotal = data.crossTimezoneWins + data.crossTimezoneLosses;
      const crossRecord = `${data.crossTimezoneWins}-${data.crossTimezoneLosses}`;
      return {
        team,
        awayGames: totalAway,
        awayWins: data.wins,
        awayLosses: data.losses,
        crossTimezoneRecord: crossRecord,
      };
    })
    .sort((a, b) => b.awayGames - a.awayGames);

  return {
    timezoneAdvantage,
    crossCountryResults: {
      games: crossCountryGames,
      homeWinPct: crossCountryHomeWinPct,
      avgMargin: crossCountryAvgMargin,
    },
    teamTravelRecords,
  };
}
