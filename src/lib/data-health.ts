export interface DataHealthReport {
  sport: string;
  totalGames: number;
  totalSeasons: number;
  seasonsWithData: number[];
  completeness: {
    scores: number; // percentage of games with non-zero scores
    quarters: number; // percentage with quarter data (NFL only)
    turnovers: number; // percentage with turnover data (NFL only)
  };
  grade: string; // "A", "B", "C", "D", "F"
}

interface NflGame {
  homeScore: number;
  awayScore: number;
  homeQ1?: number | null;
  homeFumbles?: number | null;
}

interface CfbOrCbbGame {
  homeScore: number;
  awayScore: number;
  season: { year: number };
}

export function computeDataHealth(
  games: NflGame[] | CfbOrCbbGame[],
  sport: string
): DataHealthReport {
  if (games.length === 0) {
    return {
      sport,
      totalGames: 0,
      totalSeasons: 0,
      seasonsWithData: [],
      completeness: {
        scores: 0,
        quarters: 0,
        turnovers: 0,
      },
      grade: "F",
    };
  }

  // Extract seasons
  const seasons = new Set<number>();
  games.forEach((game) => {
    if ("season" in game && game.season && "year" in game.season) {
      seasons.add(game.season.year);
    }
  });

  const seasonsWithData = Array.from(seasons).sort((a, b) => a - b);

  // Calculate score completeness
  const gamesWithScores = games.filter(
    (g) => g.homeScore > 0 && g.awayScore > 0
  );
  const scoreCompleteness = (gamesWithScores.length / games.length) * 100;

  // Calculate quarter completeness (NFL only)
  let quarterCompleteness = 0;
  if (sport === "nfl") {
    const nflGames = games as NflGame[];
    const gamesWithQuarters = nflGames.filter(
      (g) => g.homeQ1 !== null && g.homeQ1 !== undefined
    );
    quarterCompleteness = (gamesWithQuarters.length / games.length) * 100;
  }

  // Calculate turnover completeness (NFL only)
  let turnoverCompleteness = 0;
  if (sport === "nfl") {
    const nflGames = games as NflGame[];
    const gamesWithTurnovers = nflGames.filter(
      (g) => g.homeFumbles !== null && g.homeFumbles !== undefined
    );
    turnoverCompleteness = (gamesWithTurnovers.length / games.length) * 100;
  }

  // Determine grade based on average completeness
  const avgCompleteness = (scoreCompleteness + quarterCompleteness) / 2;
  let grade: string;
  if (avgCompleteness >= 90) {
    grade = "A";
  } else if (avgCompleteness >= 80) {
    grade = "B";
  } else if (avgCompleteness >= 70) {
    grade = "C";
  } else if (avgCompleteness >= 60) {
    grade = "D";
  } else {
    grade = "F";
  }

  return {
    sport,
    totalGames: games.length,
    totalSeasons: seasonsWithData.length,
    seasonsWithData,
    completeness: {
      scores: Math.round(scoreCompleteness * 100) / 100,
      quarters: Math.round(quarterCompleteness * 100) / 100,
      turnovers: Math.round(turnoverCompleteness * 100) / 100,
    },
    grade,
  };
}
