/**
 * Pure scoring distribution analysis — no DB dependency.
 * Analyzes scoring patterns across games.
 */

export interface ScoringGame {
  season: number;
  homeScore: number;
  awayScore: number;
  isPlayoff: boolean;
  primetime: string | null;
  date: string;
}

export interface ScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: string;
}

export interface MarginBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  percentage: string;
}

export interface EraScoring {
  era: string;
  decade: number;
  games: number;
  avgTotal: string;
  avgHome: string;
  avgAway: string;
  highestGame: number;
  lowestGame: number;
}

export interface DayOfWeekScoring {
  day: string;
  games: number;
  avgTotal: string;
  avgHome: string;
  avgAway: string;
}

export interface PrimetimeScoring {
  label: string;
  games: number;
  avgTotal: string;
  avgHome: string;
  avgAway: string;
}

export interface ScoringDistributionResult {
  totalGames: number;
  overallAvgTotal: string;
  scoreDistribution: ScoreBucket[];
  marginDistribution: MarginBucket[];
  byEra: EraScoring[];
  byDayOfWeek: DayOfWeekScoring[];
  primetimeComparison: {
    primetime: PrimetimeScoring;
    regular: PrimetimeScoring;
  };
}

const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20 },
  { label: "21-30", min: 21, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51-60", min: 51, max: 60 },
  { label: "61+", min: 61, max: 1000 },
];

const MARGIN_BUCKETS = [
  { label: "0 (Tie)", min: 0, max: 0 },
  { label: "1-3", min: 1, max: 3 },
  { label: "4-7", min: 4, max: 7 },
  { label: "8-14", min: 8, max: 14 },
  { label: "15-21", min: 15, max: 21 },
  { label: "22+", min: 22, max: 1000 },
];

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getUTCDay()];
}

function getDecade(season: number): number {
  return Math.floor(season / 10) * 10;
}

function getEraLabel(decade: number): string {
  return `${decade}s`;
}

export function computeScoringDistribution(games: ScoringGame[]): ScoringDistributionResult {
  if (games.length === 0) {
    return {
      totalGames: 0,
      overallAvgTotal: "0.0",
      scoreDistribution: SCORE_BUCKETS.map((b) => ({
        ...b,
        count: 0,
        percentage: ".0",
      })),
      marginDistribution: MARGIN_BUCKETS.map((b) => ({
        ...b,
        count: 0,
        percentage: ".0",
      })),
      byEra: [],
      byDayOfWeek: [],
      primetimeComparison: {
        primetime: { label: "Primetime", games: 0, avgTotal: "0.0", avgHome: "0.0", avgAway: "0.0" },
        regular: { label: "Regular", games: 0, avgTotal: "0.0", avgHome: "0.0", avgAway: "0.0" },
      },
    };
  }

  // Score distribution
  const scoreDistribution = SCORE_BUCKETS.map((bucket) => {
    const count = games.filter((g) => {
      const total = g.homeScore + g.awayScore;
      return total >= bucket.min && total <= bucket.max;
    }).length;
    return {
      ...bucket,
      count,
      percentage: ((count / games.length) * 100).toFixed(1),
    };
  });

  // Margin distribution
  const marginDistribution = MARGIN_BUCKETS.map((bucket) => {
    const count = games.filter((g) => {
      const margin = Math.abs(g.homeScore - g.awayScore);
      return margin >= bucket.min && margin <= bucket.max;
    }).length;
    return {
      ...bucket,
      count,
      percentage: ((count / games.length) * 100).toFixed(1),
    };
  });

  // Overall stats
  let totalPoints = 0;
  let totalHome = 0;
  let totalAway = 0;
  for (const g of games) {
    totalPoints += g.homeScore + g.awayScore;
    totalHome += g.homeScore;
    totalAway += g.awayScore;
  }

  // Era/decade analysis
  const eraMap = new Map<number, {
    games: number;
    total: number;
    home: number;
    away: number;
    highest: number;
    lowest: number;
  }>();

  for (const g of games) {
    const decade = getDecade(g.season);
    if (!eraMap.has(decade)) {
      eraMap.set(decade, {
        games: 0,
        total: 0,
        home: 0,
        away: 0,
        highest: 0,
        lowest: Infinity,
      });
    }
    const era = eraMap.get(decade)!;
    era.games++;
    const gameTotal = g.homeScore + g.awayScore;
    era.total += gameTotal;
    era.home += g.homeScore;
    era.away += g.awayScore;
    if (gameTotal > era.highest) era.highest = gameTotal;
    if (gameTotal < era.lowest) era.lowest = gameTotal;
  }

  const byEra: EraScoring[] = [...eraMap.entries()]
    .sort(([a], [b]) => b - a)
    .map(([decade, data]) => ({
      era: getEraLabel(decade),
      decade,
      games: data.games,
      avgTotal: (data.total / data.games).toFixed(1),
      avgHome: (data.home / data.games).toFixed(1),
      avgAway: (data.away / data.games).toFixed(1),
      highestGame: data.highest,
      lowestGame: data.lowest === Infinity ? 0 : data.lowest,
    }));

  // Day of week analysis
  const dayMap = new Map<string, {
    games: number;
    total: number;
    home: number;
    away: number;
  }>();

  const dayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const g of games) {
    const day = getDayOfWeek(g.date);
    if (!dayMap.has(day)) {
      dayMap.set(day, { games: 0, total: 0, home: 0, away: 0 });
    }
    const d = dayMap.get(day)!;
    d.games++;
    d.total += g.homeScore + g.awayScore;
    d.home += g.homeScore;
    d.away += g.awayScore;
  }

  const byDayOfWeek: DayOfWeekScoring[] = dayOrder
    .filter((day) => dayMap.has(day))
    .map((day) => {
      const data = dayMap.get(day)!;
      return {
        day,
        games: data.games,
        avgTotal: (data.total / data.games).toFixed(1),
        avgHome: (data.home / data.games).toFixed(1),
        avgAway: (data.away / data.games).toFixed(1),
      };
    });

  // Primetime comparison
  let ptGames = 0, ptTotal = 0, ptHome = 0, ptAway = 0;
  let rgGames = 0, rgTotal = 0, rgHome = 0, rgAway = 0;

  for (const g of games) {
    const gameTotal = g.homeScore + g.awayScore;
    if (g.primetime) {
      ptGames++;
      ptTotal += gameTotal;
      ptHome += g.homeScore;
      ptAway += g.awayScore;
    } else {
      rgGames++;
      rgTotal += gameTotal;
      rgHome += g.homeScore;
      rgAway += g.awayScore;
    }
  }

  const primetimeComparison = {
    primetime: {
      label: "Primetime",
      games: ptGames,
      avgTotal: ptGames > 0 ? (ptTotal / ptGames).toFixed(1) : "0.0",
      avgHome: ptGames > 0 ? (ptHome / ptGames).toFixed(1) : "0.0",
      avgAway: ptGames > 0 ? (ptAway / ptGames).toFixed(1) : "0.0",
    },
    regular: {
      label: "Regular",
      games: rgGames,
      avgTotal: rgGames > 0 ? (rgTotal / rgGames).toFixed(1) : "0.0",
      avgHome: rgGames > 0 ? (rgHome / rgGames).toFixed(1) : "0.0",
      avgAway: rgGames > 0 ? (rgAway / rgGames).toFixed(1) : "0.0",
    },
  };

  return {
    totalGames: games.length,
    overallAvgTotal: (totalPoints / games.length).toFixed(1),
    scoreDistribution,
    marginDistribution,
    byEra,
    byDayOfWeek,
    primetimeComparison,
  };
}
