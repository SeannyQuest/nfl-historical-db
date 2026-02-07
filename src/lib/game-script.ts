/**
 * Pure function for game script analysis — betting line accuracy and favorite performance — no DB dependency.
 */

export interface GameScriptGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  overUnder: number | null;
}

export interface FavoriteRecord {
  favoredByRange: string;
  wins: number;
  losses: number;
  winPct: string;
  atsRecord: string;
}

export interface UnderdogUpset {
  season: number;
  homeTeam: string;
  awayTeam: string;
  spread: number;
  finalMargin: number;
  homeScore: number;
  awayScore: number;
}

export interface OverUnderTrend {
  ouRange: string;
  overPct: string;
  games: number;
}

export interface LineAccuracy {
  avgSpreadError: string;
  avgOUError: string;
}

export interface GameScriptResult {
  favoriteRecords: FavoriteRecord[];
  underdogUpsets: UnderdogUpset[];
  overUnderTrends: OverUnderTrend[];
  lineAccuracy: LineAccuracy;
}

function getFavorRange(spread: number): string {
  const abs = Math.abs(spread);
  if (abs >= 1 && abs <= 3) return "1-3";
  if (abs > 3 && abs <= 7) return "3.5-7";
  if (abs > 7 && abs <= 14) return "7.5-14";
  return "14+";
}

function getOURange(ou: number): string {
  if (ou >= 35 && ou < 40) return "35-40";
  if (ou >= 40 && ou < 45) return "40-45";
  if (ou >= 45 && ou < 50) return "45-50";
  return "50+";
}

export function computeGameScript(games: GameScriptGame[]): GameScriptResult {
  const favoriteMap = new Map<
    string,
    { wins: number; losses: number; covers: number; totalGames: number }
  >();
  const ouMap = new Map<string, { overs: number; unders: number; games: number }>();
  const upsets: UnderdogUpset[] = [];

  let totalSpreadError = 0;
  let spreadGames = 0;
  let totalOUError = 0;
  let ouGames = 0;

  for (const g of games) {
    const totalPoints = g.homeScore + g.awayScore;
    const margin = g.homeScore - g.awayScore; // positive = home favored won

    // Spread analysis
    if (g.spread !== null && g.spread !== 0) {
      const range = getFavorRange(g.spread);
      if (!favoriteMap.has(range)) {
        favoriteMap.set(range, { wins: 0, losses: 0, covers: 0, totalGames: 0 });
      }
      const fav = favoriteMap.get(range)!;
      fav.totalGames++;

      // Spread error (absolute difference between actual margin and spread)
      totalSpreadError += Math.abs(margin - g.spread);
      spreadGames++;

      // Determine if favorite (positive spread = home favored) covered
      const homeIsFavored = g.spread > 0;
      const isCover = homeIsFavored
        ? margin >= g.spread // Home favored, needs to win by spread
        : -margin >= -g.spread; // Away favored, needs to win by spread

      if (isCover) {
        fav.covers++;
      }

      // Track if home/away won against spread
      if (homeIsFavored) {
        if (margin > 0) {
          fav.wins++;
        } else if (margin < 0) {
          fav.losses++;
        }
      } else {
        if (margin < 0) {
          fav.wins++;
        } else if (margin > 0) {
          fav.losses++;
        }
      }

      // Track upsets: underdog wins by more than spread
      if (g.spread > 0 && margin < -g.spread) {
        // Home favored but away won by more
        upsets.push({
          season: g.season,
          homeTeam: g.homeTeamName,
          awayTeam: g.awayTeamName,
          spread: g.spread,
          finalMargin: Math.abs(margin),
          homeScore: g.homeScore,
          awayScore: g.awayScore,
        });
      } else if (g.spread < 0 && margin > -g.spread) {
        // Away favored but home won by more
        upsets.push({
          season: g.season,
          homeTeam: g.homeTeamName,
          awayTeam: g.awayTeamName,
          spread: g.spread,
          finalMargin: Math.abs(margin),
          homeScore: g.homeScore,
          awayScore: g.awayScore,
        });
      }
    }

    // Over/Under analysis
    if (g.overUnder !== null && g.overUnder > 0) {
      const range = getOURange(g.overUnder);
      if (!ouMap.has(range)) {
        ouMap.set(range, { overs: 0, unders: 0, games: 0 });
      }
      const ou = ouMap.get(range)!;
      ou.games++;

      if (totalPoints > g.overUnder) {
        ou.overs++;
      } else {
        ou.unders++;
      }

      totalOUError += Math.abs(totalPoints - g.overUnder);
      ouGames++;
    }
  }

  // Convert favorite records
  const favoriteRecords: FavoriteRecord[] = Array.from(favoriteMap.entries())
    .map(([range, data]) => ({
      favoredByRange: range,
      wins: data.wins,
      losses: data.losses,
      winPct: data.totalGames > 0 ? (data.wins / data.totalGames).toFixed(3) : "0.000",
      atsRecord: `${data.covers}-${data.totalGames - data.covers}`,
    }))
    .sort((a, b) => {
      const aOrder = ["1-3", "3.5-7", "7.5-14", "14+"];
      return aOrder.indexOf(a.favoredByRange) - aOrder.indexOf(b.favoredByRange);
    });

  // Biggest upsets: top 20 by spread magnitude
  upsets.sort((a, b) => Math.abs(b.spread) - Math.abs(a.spread));
  const topUpsets = upsets.slice(0, 20);

  // Over/Under trends
  const ouTrends: OverUnderTrend[] = Array.from(ouMap.entries())
    .map(([range, data]) => ({
      ouRange: range,
      overPct: data.games > 0 ? (data.overs / data.games).toFixed(3) : "0.000",
      games: data.games,
    }))
    .sort((a, b) => {
      const order = ["35-40", "40-45", "45-50", "50+"];
      return order.indexOf(a.ouRange) - order.indexOf(b.ouRange);
    });

  // Line accuracy
  const lineAccuracy: LineAccuracy = {
    avgSpreadError: spreadGames > 0 ? (totalSpreadError / spreadGames).toFixed(2) : "0.00",
    avgOUError: ouGames > 0 ? (totalOUError / ouGames).toFixed(2) : "0.00",
  };

  return {
    favoriteRecords,
    underdogUpsets: topUpsets,
    overUnderTrends: ouTrends,
    lineAccuracy,
  };
}
