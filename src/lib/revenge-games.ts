/**
 * Pure revenge game analysis — no DB dependency.
 * A "revenge game" = rematch within same season where loser of first meeting hosts
 */

export interface RevengeGame {
  season: number;
  week: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface ComputedRevengeGame {
  season: number;
  week: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  originalWeek: number;
  originalWinner: string;
  gotRevenge: boolean;
}

export interface TeamRevengeRecord {
  team: string;
  revengeGamesPlayed: number;
  revengeWins: number;
  revengeWinPct: number;
}

export interface RevengeGameResult {
  revengeGames: ComputedRevengeGame[];
  revengeWinPct: number;
  teamRevengeRecords: TeamRevengeRecord[];
}

export function computeRevengeGames(games: RevengeGame[]): RevengeGameResult {
  // Group games by season
  const seasonGames = new Map<number, RevengeGame[]>();
  for (const g of games) {
    if (!seasonGames.has(g.season)) {
      seasonGames.set(g.season, []);
    }
    seasonGames.get(g.season)!.push(g);
  }

  const revengeGames: ComputedRevengeGame[] = [];
  const teamRevengeMap = new Map<string, { played: number; wins: number }>();

  // For each season, find all matchups between two teams
  for (const [season, seasonGamesArray] of seasonGames) {
    // Group by normalized matchup key (sort teams alphabetically)
    const matchupMap = new Map<string, RevengeGame[]>();

    for (const g of seasonGamesArray) {
      const teams = [g.homeTeamName, g.awayTeamName].sort();
      const key = teams.join("|");

      if (!matchupMap.has(key)) {
        matchupMap.set(key, []);
      }
      matchupMap.get(key)!.push(g);
    }

    // For each matchup with 2+ games, check for revenge game pattern
    for (const [, matchupGames] of matchupMap) {
      if (matchupGames.length < 2) continue;

      // Sort by week
      matchupGames.sort((a, b) => a.week - b.week);

      // Process pairs of consecutive meetings
      for (let i = 0; i < matchupGames.length - 1; i++) {
        const first = matchupGames[i];
        const second = matchupGames[i + 1];

        // Determine winner and loser of first game
        const firstWinner =
          first.homeScore > first.awayScore ? first.homeTeamName : first.awayTeamName;
        const firstLoser =
          first.homeScore > first.awayScore ? first.awayTeamName : first.homeTeamName;

        // A rematch is ANY game between the same two teams where loser hosts
        const isRematch =
          (first.homeTeamName === second.homeTeamName && first.awayTeamName === second.awayTeamName) ||
          (first.homeTeamName === second.awayTeamName && first.awayTeamName === second.homeTeamName);

        if (!isRematch) continue;

        // Check if loser hosts in the second game (this makes it a "revenge" opportunity)
        const loserIsHomeInSecond = second.homeTeamName === firstLoser;

        if (loserIsHomeInSecond) {
          const secondWinner =
            second.homeScore > second.awayScore ? second.homeTeamName : second.awayTeamName;
          const gotRevenge = secondWinner === firstLoser;

          revengeGames.push({
            season,
            week: second.week,
            homeTeam: second.homeTeamName,
            awayTeam: second.awayTeamName,
            homeScore: second.homeScore,
            awayScore: second.awayScore,
            originalWeek: first.week,
            originalWinner: firstWinner,
            gotRevenge,
          });

          // Track team stats for the team seeking revenge (first loser)
          const revengeTeam = firstLoser;
          const entry = teamRevengeMap.get(revengeTeam) || { played: 0, wins: 0 };
          entry.played++;
          if (gotRevenge) entry.wins++;
          teamRevengeMap.set(revengeTeam, entry);
        }
      }
    }
  }

  // Calculate overall revenge win pct
  let totalRevengeWins = 0;
  for (const [, data] of teamRevengeMap) {
    totalRevengeWins += data.wins;
  }
  const revengeWinPct =
    revengeGames.length > 0 ? (totalRevengeWins / revengeGames.length) * 100 : 0;

  // Build team records
  const teamRevengeRecords: TeamRevengeRecord[] = [...teamRevengeMap.entries()]
    .map(([team, data]) => ({
      team,
      revengeGamesPlayed: data.played,
      revengeWins: data.wins,
      revengeWinPct: data.played > 0 ? (data.wins / data.played) * 100 : 0,
    }))
    .sort((a, b) => b.revengeWinPct - a.revengeWinPct);

  return {
    revengeGames,
    revengeWinPct,
    teamRevengeRecords,
  };
}
