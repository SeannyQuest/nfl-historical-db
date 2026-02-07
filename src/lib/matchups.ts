/**
 * Pure head-to-head matchup computation — no DB dependency.
 * Operates on arrays of game-like objects to compute H2H records and trends.
 */

export interface MatchupGame {
  date: string;
  week: string;
  season: number;
  isPlayoff: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  spreadResult: string | null;
  ouResult: string | null;
  spread: number | null;
  overUnder: number | null;
}

export interface MatchupRecord {
  wins: number;
  losses: number;
  ties: number;
  pct: string;
}

export interface MatchupScoringTrend {
  avgTotal: string;
  avgMargin: string;
  highestTotal: number;
  lowestTotal: number;
}

export interface MatchupBettingTrend {
  favoriteRecord: string; // "TEAM1 favored X times, covered Y"
  avgSpread: string;
  overCount: number;
  underCount: number;
  pushCount: number;
  overPct: string;
}

export interface MatchupGameSummary {
  date: string;
  season: number;
  week: string;
  isPlayoff: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  spread: number | null;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface MatchupResult {
  team1: string;
  team2: string;
  totalGames: number;
  team1Record: MatchupRecord;
  team2Record: MatchupRecord;
  scoring: MatchupScoringTrend;
  betting: MatchupBettingTrend;
  recentGames: MatchupGameSummary[];
  streakTeam: string | null;
  streakCount: number;
}

function buildRecord(wins: number, losses: number, ties: number): MatchupRecord {
  const total = wins + losses + ties;
  return {
    wins,
    losses,
    ties,
    pct: total > 0 ? (wins / total).toFixed(3) : ".000",
  };
}

export function computeMatchup(
  games: MatchupGame[],
  team1: string,
  team2: string
): MatchupResult {
  let t1Wins = 0, t1Losses = 0, ties = 0;
  let totalPoints = 0;
  let totalMargin = 0;
  let highestTotal = 0;
  let lowestTotal = Infinity;

  // Betting
  let t1FavoredCount = 0, t1FavoredCovered = 0;
  let t2FavoredCount = 0, t2FavoredCovered = 0;
  let overCount = 0, underCount = 0, ouPushCount = 0;
  let totalSpread = 0, spreadGameCount = 0;

  // Sort games by date ascending for streak calculation
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date));

  for (const g of sorted) {
    const total = g.homeScore + g.awayScore;
    totalPoints += total;
    if (total > highestTotal) highestTotal = total;
    if (total < lowestTotal) lowestTotal = total;

    // Determine team1's score and team2's score
    const isTeam1Home = g.homeTeamName === team1;
    const t1Score = isTeam1Home ? g.homeScore : g.awayScore;
    const t2Score = isTeam1Home ? g.awayScore : g.homeScore;
    totalMargin += t1Score - t2Score;

    if (g.winnerName === team1) t1Wins++;
    else if (g.winnerName === team2) t1Losses++;
    else ties++;

    // Betting analysis
    if (g.spread != null) {
      spreadGameCount++;
      // Spread is from home team perspective (negative = home favored)
      // Determine who was favored
      const homeFavored = g.spread < 0;
      const team1Favored = isTeam1Home ? homeFavored : !homeFavored;

      if (team1Favored) {
        t1FavoredCount++;
        // Did the favorite cover? Check from home perspective
        if (isTeam1Home) {
          if (g.spreadResult === "COVERED") t1FavoredCovered++;
        } else {
          // Team1 is away and favored; home LOST means favorite (team1) covered
          if (g.spreadResult === "LOST") t1FavoredCovered++;
        }
      } else {
        t2FavoredCount++;
        if (isTeam1Home) {
          // Team2 is away and favored; home LOST means favorite (team2) covered
          if (g.spreadResult === "LOST") t2FavoredCovered++;
        } else {
          // Team2 is home and favored
          if (g.spreadResult === "COVERED") t2FavoredCovered++;
        }
      }

      totalSpread += Math.abs(g.spread);
    }

    // O/U
    if (g.ouResult === "OVER") overCount++;
    else if (g.ouResult === "UNDER") underCount++;
    else if (g.ouResult === "PUSH") ouPushCount++;
  }

  const totalGames = sorted.length;

  // Streak — walk from most recent backwards
  let streakTeam: string | null = null;
  let streakCount = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const g = sorted[i];
    if (i === sorted.length - 1) {
      if (g.winnerName === team1 || g.winnerName === team2) {
        streakTeam = g.winnerName;
        streakCount = 1;
      } else {
        break; // tie breaks streak
      }
    } else {
      if (g.winnerName === streakTeam) {
        streakCount++;
      } else {
        break;
      }
    }
  }

  // Build favorite record string
  const totalFavored = t1FavoredCount + t2FavoredCount;
  let favoriteRecord: string;
  if (totalFavored === 0) {
    favoriteRecord = "No spread data";
  } else if (t1FavoredCount >= t2FavoredCount) {
    favoriteRecord = `${team1} favored ${t1FavoredCount}x, covered ${t1FavoredCovered}`;
  } else {
    favoriteRecord = `${team2} favored ${t2FavoredCount}x, covered ${t2FavoredCovered}`;
  }

  const ouTotal = overCount + underCount + ouPushCount;

  // Recent games — last 10, most recent first
  const recentGames: MatchupGameSummary[] = sorted
    .slice(-10)
    .reverse()
    .map((g) => ({
      date: g.date,
      season: g.season,
      week: g.week,
      isPlayoff: g.isPlayoff,
      homeTeamName: g.homeTeamName,
      awayTeamName: g.awayTeamName,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winnerName,
      spread: g.spread,
      spreadResult: g.spreadResult,
      ouResult: g.ouResult,
    }));

  return {
    team1,
    team2,
    totalGames,
    team1Record: buildRecord(t1Wins, t1Losses, ties),
    team2Record: buildRecord(t1Losses, t1Wins, ties),
    scoring: {
      avgTotal: totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : "0.0",
      avgMargin: totalGames > 0 ? (Math.abs(totalMargin) / totalGames).toFixed(1) : "0.0",
      highestTotal: totalGames > 0 ? highestTotal : 0,
      lowestTotal: totalGames > 0 ? lowestTotal : 0,
    },
    betting: {
      favoriteRecord,
      avgSpread: spreadGameCount > 0 ? (totalSpread / spreadGameCount).toFixed(1) : "0.0",
      overCount,
      underCount,
      pushCount: ouPushCount,
      overPct: ouTotal > 0 ? (overCount / ouTotal).toFixed(3) : ".000",
    },
    recentGames,
    streakTeam,
    streakCount,
  };
}
