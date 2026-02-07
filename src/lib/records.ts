/**
 * Pure record book computation — no DB dependency.
 * Finds superlatives and extremes from game-like objects.
 */

export interface RecordGame {
  id: string;
  date: string;
  season: number;
  week: string;
  isPlayoff: boolean;
  homeTeamName: string;
  homeTeamAbbr: string;
  awayTeamName: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  spread: number | null;
  spreadResult: string | null;
  ouResult: string | null;
  overUnder: number | null;
}

export interface RecordEntry {
  rank: number;
  game: RecordGame;
  value: number;
  label: string;
}

export interface TeamSeasonEntry {
  rank: number;
  teamName: string;
  teamAbbr: string;
  season: number;
  value: string;
  detail: string;
}

export interface RecordsResult {
  highestScoringGames: RecordEntry[];
  lowestScoringGames: RecordEntry[];
  biggestBlowouts: RecordEntry[];
  closestGames: RecordEntry[];
  highestHomeScores: RecordEntry[];
  highestAwayScores: RecordEntry[];
  bestTeamSeasons: TeamSeasonEntry[];
  worstTeamSeasons: TeamSeasonEntry[];
}

function formatMatchup(g: RecordGame): string {
  return `${g.awayTeamAbbr} @ ${g.homeTeamAbbr}`;
}

function formatScore(g: RecordGame): string {
  return `${g.awayScore}-${g.homeScore}`;
}

function sortAndRank<T extends { rank: number }>(
  items: T[],
  limit: number
): T[] {
  return items.slice(0, limit).map((item, i) => ({ ...item, rank: i + 1 }));
}

export function computeRecords(
  games: RecordGame[],
  limit: number = 10
): RecordsResult {
  if (games.length === 0) {
    return {
      highestScoringGames: [],
      lowestScoringGames: [],
      biggestBlowouts: [],
      closestGames: [],
      highestHomeScores: [],
      highestAwayScores: [],
      bestTeamSeasons: [],
      worstTeamSeasons: [],
    };
  }

  // Game-level records
  const withTotals = games.map((g) => ({
    game: g,
    total: g.homeScore + g.awayScore,
    diff: Math.abs(g.homeScore - g.awayScore),
  }));

  // Highest scoring
  const highestScoringGames = sortAndRank(
    [...withTotals]
      .sort((a, b) => b.total - a.total)
      .map((r) => ({
        rank: 0,
        game: r.game,
        value: r.total,
        label: `${formatMatchup(r.game)} ${formatScore(r.game)} (${r.total} pts)`,
      })),
    limit
  );

  // Lowest scoring
  const lowestScoringGames = sortAndRank(
    [...withTotals]
      .sort((a, b) => a.total - b.total)
      .map((r) => ({
        rank: 0,
        game: r.game,
        value: r.total,
        label: `${formatMatchup(r.game)} ${formatScore(r.game)} (${r.total} pts)`,
      })),
    limit
  );

  // Biggest blowouts
  const biggestBlowouts = sortAndRank(
    [...withTotals]
      .sort((a, b) => b.diff - a.diff)
      .map((r) => ({
        rank: 0,
        game: r.game,
        value: r.diff,
        label: `${formatMatchup(r.game)} ${formatScore(r.game)} (${r.diff} pt margin)`,
      })),
    limit
  );

  // Closest games (non-ties first sorted by diff asc, then ties)
  const closestGames = sortAndRank(
    [...withTotals]
      .sort((a, b) => a.diff - b.diff)
      .map((r) => ({
        rank: 0,
        game: r.game,
        value: r.diff,
        label: `${formatMatchup(r.game)} ${formatScore(r.game)} (${r.diff === 0 ? "TIE" : `${r.diff} pt margin`})`,
      })),
    limit
  );

  // Highest home scores
  const highestHomeScores = sortAndRank(
    [...games]
      .sort((a, b) => b.homeScore - a.homeScore)
      .map((g) => ({
        rank: 0,
        game: g,
        value: g.homeScore,
        label: `${g.homeTeamAbbr} scored ${g.homeScore} vs ${g.awayTeamAbbr}`,
      })),
    limit
  );

  // Highest away scores
  const highestAwayScores = sortAndRank(
    [...games]
      .sort((a, b) => b.awayScore - a.awayScore)
      .map((g) => ({
        rank: 0,
        game: g,
        value: g.awayScore,
        label: `${g.awayTeamAbbr} scored ${g.awayScore} @ ${g.homeTeamAbbr}`,
      })),
    limit
  );

  // Team season records
  const teamSeasonMap = new Map<
    string,
    { teamName: string; teamAbbr: string; season: number; wins: number; losses: number; ties: number; games: number }
  >();

  for (const g of games) {
    if (g.isPlayoff) continue; // Only regular season for team records

    for (const side of ["home", "away"] as const) {
      const teamName = side === "home" ? g.homeTeamName : g.awayTeamName;
      const teamAbbr = side === "home" ? g.homeTeamAbbr : g.awayTeamAbbr;
      const key = `${teamName}|${g.season}`;

      if (!teamSeasonMap.has(key)) {
        teamSeasonMap.set(key, { teamName, teamAbbr, season: g.season, wins: 0, losses: 0, ties: 0, games: 0 });
      }

      const entry = teamSeasonMap.get(key)!;
      entry.games++;

      if (g.winnerName === teamName) entry.wins++;
      else if (g.winnerName === null) entry.ties++;
      else entry.losses++;
    }
  }

  const teamSeasons = [...teamSeasonMap.values()].filter((ts) => ts.games >= 10);

  const bestTeamSeasons = sortAndRank(
    [...teamSeasons]
      .sort((a, b) => {
        const pctA = a.wins / a.games;
        const pctB = b.wins / b.games;
        if (pctB !== pctA) return pctB - pctA;
        return b.wins - a.wins;
      })
      .map((ts) => ({
        rank: 0,
        teamName: ts.teamName,
        teamAbbr: ts.teamAbbr,
        season: ts.season,
        value: (ts.wins / ts.games).toFixed(3),
        detail: ts.ties > 0
          ? `${ts.wins}-${ts.losses}-${ts.ties}`
          : `${ts.wins}-${ts.losses}`,
      })),
    limit
  );

  const worstTeamSeasons = sortAndRank(
    [...teamSeasons]
      .sort((a, b) => {
        const pctA = a.wins / a.games;
        const pctB = b.wins / b.games;
        if (pctA !== pctB) return pctA - pctB;
        return a.wins - b.wins;
      })
      .map((ts) => ({
        rank: 0,
        teamName: ts.teamName,
        teamAbbr: ts.teamAbbr,
        season: ts.season,
        value: (ts.wins / ts.games).toFixed(3),
        detail: ts.ties > 0
          ? `${ts.wins}-${ts.losses}-${ts.ties}`
          : `${ts.wins}-${ts.losses}`,
      })),
    limit
  );

  return {
    highestScoringGames,
    lowestScoringGames,
    biggestBlowouts,
    closestGames,
    highestHomeScores,
    highestAwayScores,
    bestTeamSeasons,
    worstTeamSeasons,
  };
}
