export interface CrossSportComparison {
  sport: string;
  homeWinPct: string;
  avgPointsPerGame: string;
  avgMarginOfVictory: string;
  blowoutPct: string; // games with 20+ point margin
}

interface GameScore {
  homeScore: number;
  awayScore: number;
}

export function computeCrossSportComparison(
  nflGames: GameScore[],
  cfbGames: GameScore[],
  cbbGames: GameScore[]
): CrossSportComparison[] {
  const results: CrossSportComparison[] = [];

  // Analyze NFL
  if (nflGames.length > 0) {
    results.push(analyzeGameStats("NFL", nflGames));
  }

  // Analyze CFB
  if (cfbGames.length > 0) {
    results.push(analyzeGameStats("CFB", cfbGames));
  }

  // Analyze CBB
  if (cbbGames.length > 0) {
    results.push(analyzeGameStats("CBB", cbbGames));
  }

  return results;
}

function analyzeGameStats(sport: string, games: GameScore[]): CrossSportComparison {
  const totalGames = games.length;

  // Calculate home wins
  const homeWins = games.filter((g) => g.homeScore > g.awayScore).length;
  const homeWinPct = ((homeWins / totalGames) * 100).toFixed(2);

  // Calculate total points and average
  const totalPoints = games.reduce(
    (sum, g) => sum + g.homeScore + g.awayScore,
    0
  );
  const avgPointsPerGame = (totalPoints / totalGames).toFixed(2);

  // Calculate margins and average
  const margins = games.map((g) => Math.abs(g.homeScore - g.awayScore));
  const totalMargin = margins.reduce((sum, m) => sum + m, 0);
  const avgMarginOfVictory = (totalMargin / totalGames).toFixed(2);

  // Calculate blowout percentage (20+ point margin)
  const blowouts = margins.filter((m) => m >= 20).length;
  const blowoutPct = ((blowouts / totalGames) * 100).toFixed(2);

  return {
    sport,
    homeWinPct,
    avgPointsPerGame,
    avgMarginOfVictory,
    blowoutPct,
  };
}
