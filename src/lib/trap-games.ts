/**
 * Trap Game Identifier — heavily favored teams that lose outright.
 * Pure function, no DB dependency.
 */

export interface TrapGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
}

export interface TrapGameRecord {
  season: number;
  week: number;
  favorite: string;
  underdog: string;
  spread: number;
  favoriteScore: number;
  underdogScore: number;
  margin: number;
}

export interface TrapGameFrequencyRecord {
  season: number;
  trapGames: number;
  totalBigFavoriteGames: number;
  pct: string;
}

export interface MostTrappedRecord {
  team: string;
  trapLosses: number;
  bigFavoriteGames: number;
}

export interface BestTrapperRecord {
  team: string;
  trapWins: number;
  gamesBeatBigFavorite: number;
}

export interface TrapGamesResult {
  trapGames: TrapGameRecord[];
  trapGameFrequency: TrapGameFrequencyRecord[];
  mostTrapped: MostTrappedRecord[];
  bestTrappers: BestTrapperRecord[];
}

export function computeTrapGames(games: TrapGame[]): TrapGamesResult {
  if (games.length === 0) {
    return {
      trapGames: [],
      trapGameFrequency: [],
      mostTrapped: [],
      bestTrappers: [],
    };
  }

  const trapGamesArray: TrapGameRecord[] = [];
  const trapCountBySeasonMap = new Map<number, { traps: number; total: number }>();
  const mostTrappedMap = new Map<string, { trapLosses: number; bigFavGames: number }>();
  const bestTrappersMap = new Map<string, { trapWins: number; beatBigFav: number }>();

  for (const g of games) {
    // Skip games without spread
    if (g.spread === null) continue;

    // Initialize season tracking
    if (!trapCountBySeasonMap.has(g.season)) {
      trapCountBySeasonMap.set(g.season, { traps: 0, total: 0 });
    }

    // Determine if it's a big favorite game (spread >= 7)
    const isBigFavoriteGame = Math.abs(g.spread) >= 7;
    if (isBigFavoriteGame) {
      trapCountBySeasonMap.get(g.season)!.total++;
    }

    if (!isBigFavoriteGame) continue;

    // Determine who is the favorite based on spread sign
    // Positive spread = away team favored, negative = home team favored
    let favoriteTeam: string;
    let underdogTeam: string;
    let favoriteScore: number;
    let underdogScore: number;
    let margin: number;

    if (g.spread > 0) {
      // Away team favored
      favoriteTeam = g.awayTeamName;
      underdogTeam = g.homeTeamName;
      favoriteScore = g.awayScore;
      underdogScore = g.homeScore;
      margin = g.homeScore - g.awayScore; // positive if home (underdog) wins
    } else {
      // Home team favored
      favoriteTeam = g.homeTeamName;
      underdogTeam = g.awayTeamName;
      favoriteScore = g.homeScore;
      underdogScore = g.awayScore;
      margin = g.awayScore - g.homeScore; // positive if away (underdog) wins
    }

    // Check if favorite lost (trap game)
    if (favoriteScore < underdogScore) {
      trapCountBySeasonMap.get(g.season)!.traps++;

      trapGamesArray.push({
        season: g.season,
        week: g.week,
        favorite: favoriteTeam,
        underdog: underdogTeam,
        spread: Math.abs(g.spread),
        favoriteScore,
        underdogScore,
        margin: Math.abs(margin),
      });

      // Track most trapped team
      if (!mostTrappedMap.has(favoriteTeam)) {
        mostTrappedMap.set(favoriteTeam, { trapLosses: 0, bigFavGames: 0 });
      }
      mostTrappedMap.get(favoriteTeam)!.trapLosses++;
      mostTrappedMap.get(favoriteTeam)!.bigFavGames++;

      // Track best trappers (underdogs that beat big favorites)
      if (!bestTrappersMap.has(underdogTeam)) {
        bestTrappersMap.set(underdogTeam, { trapWins: 0, beatBigFav: 0 });
      }
      bestTrappersMap.get(underdogTeam)!.trapWins++;
      bestTrappersMap.get(underdogTeam)!.beatBigFav++;
    } else {
      // Favorite won, but still a big favorite game
      if (!mostTrappedMap.has(favoriteTeam)) {
        mostTrappedMap.set(favoriteTeam, { trapLosses: 0, bigFavGames: 0 });
      }
      mostTrappedMap.get(favoriteTeam)!.bigFavGames++;

      if (!bestTrappersMap.has(underdogTeam)) {
        bestTrappersMap.set(underdogTeam, { trapWins: 0, beatBigFav: 0 });
      }
      bestTrappersMap.get(underdogTeam)!.beatBigFav++;
    }
  }

  // Build trap game frequency (only include seasons with big favorite games)
  const trapGameFrequency: TrapGameFrequencyRecord[] = [...trapCountBySeasonMap]
    .filter(([_, data]) => data.total > 0)
    .map(([season, data]) => ({
      season,
      trapGames: data.traps,
      totalBigFavoriteGames: data.total,
      pct:
        data.total > 0 ? ((data.traps / data.total) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.season - a.season);

  // Build most trapped (top 10 teams that lose most as big favorites)
  const mostTrapped = [...mostTrappedMap.entries()]
    .map(([team, data]) => ({
      team,
      trapLosses: data.trapLosses,
      bigFavoriteGames: data.bigFavGames,
    }))
    .sort((a, b) => b.trapLosses - a.trapLosses)
    .slice(0, 10);

  // Build best trappers (top 10 underdogs that beat big favorites most)
  const bestTrappers = [...bestTrappersMap.entries()]
    .map(([team, data]) => ({
      team,
      trapWins: data.trapWins,
      gamesBeatBigFavorite: data.beatBigFav,
    }))
    .sort((a, b) => b.trapWins - a.trapWins)
    .slice(0, 10);

  return {
    trapGames: trapGamesArray.sort((a, b) => b.season - a.season || b.week - a.week),
    trapGameFrequency,
    mostTrapped,
    bestTrappers,
  };
}
