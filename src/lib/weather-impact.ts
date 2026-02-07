/**
 * Pure weather impact computation — no DB dependency.
 * Operates on arrays of game-like objects to compute weather-related analytics.
 */

export interface WeatherGame {
  season: number;
  homeScore: number;
  awayScore: number;
  conditions: string | null;
  temperature: number | null;
  windSpeed: number | null;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface WeatherConditionStats {
  condition: string;
  games: number;
  avgTotal: string;
  avgHomeScore: string;
  avgAwayScore: string;
  homeWinPct: string;
  overPct: string;
  homeCoverPct: string;
}

export interface ColdWeatherStats {
  games: number;
  avgTotal: string;
  homeWinPct: string;
  overPct: string;
  homeCoverPct: string;
}

export interface WindImpactStats {
  lowWind: {
    games: number;
    avgTotal: string;
    homeWinPct: string;
  };
  moderateWind: {
    games: number;
    avgTotal: string;
    homeWinPct: string;
  };
  highWind: {
    games: number;
    avgTotal: string;
    homeWinPct: string;
  };
}

export interface WeatherImpactResult {
  totalGames: number;
  conditionStats: WeatherConditionStats[];
  coldWeatherAnalysis: ColdWeatherStats;
  windImpact: WindImpactStats;
  domeAdvantage: string | null;
  outdoorAdvantage: string | null;
}

export function computeWeatherImpact(games: WeatherGame[]): WeatherImpactResult {
  if (games.length === 0) {
    return {
      totalGames: 0,
      conditionStats: [],
      coldWeatherAnalysis: {
        games: 0,
        avgTotal: "0.0",
        homeWinPct: ".000",
        overPct: ".000",
        homeCoverPct: ".000",
      },
      windImpact: {
        lowWind: { games: 0, avgTotal: "0.0", homeWinPct: ".000" },
        moderateWind: { games: 0, avgTotal: "0.0", homeWinPct: ".000" },
        highWind: { games: 0, avgTotal: "0.0", homeWinPct: ".000" },
      },
      domeAdvantage: null,
      outdoorAdvantage: null,
    };
  }

  // Condition map
  const conditionMap = new Map<string, {
    games: number;
    points: number;
    homeScoreSum: number;
    awayScoreSum: number;
    homeWins: number;
    decisions: number;
    overs: number;
    ouTotal: number;
    homeCovered: number;
    spreadTotal: number;
  }>();

  // Cold weather (temp < 32°F)
  let coldGames = 0;
  let coldPoints = 0;
  let coldHomeWins = 0;
  let coldDecisions = 0;
  let coldOvers = 0;
  let coldOUTotal = 0;
  let coldCovered = 0;
  let coldSpreadTotal = 0;

  // Wind impact
  const windMap = new Map<string, {
    games: number;
    points: number;
    homeWins: number;
    decisions: number;
  }>();

  // Dome vs outdoor
  let domeHomeWins = 0,
    domeDecisions = 0;
  let outdoorHomeWins = 0,
    outdoorDecisions = 0;

  for (const g of games) {
    const total = g.homeScore + g.awayScore;
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;
    const decisions = homeWon || awayWon ? 1 : 0;

    // Parse condition
    let condition = "Unknown";
    let isDome = false;

    if (g.conditions) {
      if (
        g.conditions.includes("Dome") ||
        g.conditions.includes("dome") ||
        g.conditions.includes("Indoor")
      ) {
        condition = "Dome";
        isDome = true;
      } else if (
        g.conditions.includes("Clear") ||
        g.conditions.includes("clear")
      ) {
        condition = "Clear";
      } else if (
        g.conditions.includes("Cloudy") ||
        g.conditions.includes("cloudy")
      ) {
        condition = "Cloudy";
      } else if (
        g.conditions.includes("Rain") ||
        g.conditions.includes("rain")
      ) {
        condition = "Rain";
      } else if (
        g.conditions.includes("Snow") ||
        g.conditions.includes("snow")
      ) {
        condition = "Snow";
      } else if (
        g.conditions.includes("Overcast") ||
        g.conditions.includes("overcast")
      ) {
        condition = "Overcast";
      } else {
        condition = "Other";
      }
    }

    // Condition stats
    if (!conditionMap.has(condition)) {
      conditionMap.set(condition, {
        games: 0,
        points: 0,
        homeScoreSum: 0,
        awayScoreSum: 0,
        homeWins: 0,
        decisions: 0,
        overs: 0,
        ouTotal: 0,
        homeCovered: 0,
        spreadTotal: 0,
      });
    }
    const cond = conditionMap.get(condition)!;
    cond.games++;
    cond.points += total;
    cond.homeScoreSum += g.homeScore;
    cond.awayScoreSum += g.awayScore;
    if (homeWon) cond.homeWins++;
    cond.decisions += decisions;
    if (g.ouResult === "OVER") cond.overs++;
    if (g.ouResult === "OVER" || g.ouResult === "UNDER" || g.ouResult === "PUSH") cond.ouTotal++;
    if (g.spreadResult === "COVERED") cond.homeCovered++;
    if (g.spreadResult) cond.spreadTotal++;

    // Cold weather (< 32°F)
    if (g.temperature !== null && g.temperature < 32) {
      coldGames++;
      coldPoints += total;
      if (homeWon) coldHomeWins++;
      coldDecisions += decisions;
      if (g.ouResult === "OVER") coldOvers++;
      if (g.ouResult === "OVER" || g.ouResult === "UNDER" || g.ouResult === "PUSH") coldOUTotal++;
      if (g.spreadResult === "COVERED") coldCovered++;
      if (g.spreadResult) coldSpreadTotal++;
    }

    // Wind impact
    let windCategory = "lowWind";
    if (g.windSpeed !== null) {
      if (g.windSpeed > 15) {
        windCategory = "highWind";
      } else if (g.windSpeed > 10) {
        windCategory = "moderateWind";
      }
    }

    if (!windMap.has(windCategory)) {
      windMap.set(windCategory, { games: 0, points: 0, homeWins: 0, decisions: 0 });
    }
    const wind = windMap.get(windCategory)!;
    wind.games++;
    wind.points += total;
    if (homeWon) wind.homeWins++;
    wind.decisions += decisions;

    // Dome vs outdoor
    if (isDome) {
      if (decisions) domeDecisions++;
      if (homeWon) domeHomeWins++;
    } else if (g.conditions) {
      if (decisions) outdoorDecisions++;
      if (homeWon) outdoorHomeWins++;
    }
  }

  // Build condition stats
  const conditionStats: WeatherConditionStats[] = [...conditionMap.entries()]
    .sort((a, b) => b[1].games - a[1].games)
    .map(([condition, data]) => ({
      condition,
      games: data.games,
      avgTotal: (data.points / data.games).toFixed(1),
      avgHomeScore: (data.homeScoreSum / data.games).toFixed(1),
      avgAwayScore: (data.awayScoreSum / data.games).toFixed(1),
      homeWinPct: data.decisions > 0 ? (data.homeWins / data.decisions).toFixed(3) : ".000",
      overPct: data.ouTotal > 0 ? (data.overs / data.ouTotal).toFixed(3) : ".000",
      homeCoverPct: data.spreadTotal > 0 ? (data.homeCovered / data.spreadTotal).toFixed(3) : ".000",
    }));

  // Wind impact stats
  const lowWind = windMap.get("lowWind") || { games: 0, points: 0, homeWins: 0, decisions: 0 };
  const moderateWind = windMap.get("moderateWind") || { games: 0, points: 0, homeWins: 0, decisions: 0 };
  const highWind = windMap.get("highWind") || { games: 0, points: 0, homeWins: 0, decisions: 0 };

  const windImpact: WindImpactStats = {
    lowWind: {
      games: lowWind.games,
      avgTotal: lowWind.games > 0 ? (lowWind.points / lowWind.games).toFixed(1) : "0.0",
      homeWinPct: lowWind.decisions > 0 ? (lowWind.homeWins / lowWind.decisions).toFixed(3) : ".000",
    },
    moderateWind: {
      games: moderateWind.games,
      avgTotal: moderateWind.games > 0 ? (moderateWind.points / moderateWind.games).toFixed(1) : "0.0",
      homeWinPct: moderateWind.decisions > 0 ? (moderateWind.homeWins / moderateWind.decisions).toFixed(3) : ".000",
    },
    highWind: {
      games: highWind.games,
      avgTotal: highWind.games > 0 ? (highWind.points / highWind.games).toFixed(1) : "0.0",
      homeWinPct: highWind.decisions > 0 ? (highWind.homeWins / highWind.decisions).toFixed(3) : ".000",
    },
  };

  return {
    totalGames: games.length,
    conditionStats,
    coldWeatherAnalysis: {
      games: coldGames,
      avgTotal: coldGames > 0 ? (coldPoints / coldGames).toFixed(1) : "0.0",
      homeWinPct: coldDecisions > 0 ? (coldHomeWins / coldDecisions).toFixed(3) : ".000",
      overPct: coldOUTotal > 0 ? (coldOvers / coldOUTotal).toFixed(3) : ".000",
      homeCoverPct: coldSpreadTotal > 0 ? (coldCovered / coldSpreadTotal).toFixed(3) : ".000",
    },
    windImpact,
    domeAdvantage:
      domeDecisions > 0 ? ((domeHomeWins / domeDecisions) * 100).toFixed(1) + "%" : null,
    outdoorAdvantage:
      outdoorDecisions > 0 ? ((outdoorHomeWins / outdoorDecisions) * 100).toFixed(1) + "%" : null,
  };
}
