/**
 * Pure power rankings algorithm — no DB dependency.
 */

export interface PRGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface PowerRanking {
  rank: number;
  team: string;
  winPct: string;
  sos: string;
  pointDifferential: string;
  recentForm: string;
}

export interface PowerRankingsStats {
  season: number;
  rankings: PowerRanking[];
}

export interface PowerRankingsResult {
  stats: PowerRankingsStats;
}

export function computePowerRankings(games: PRGame[], season: number): PowerRankingsResult {
  const seasonGames = games.filter((g) => g.season === season);

  if (seasonGames.length === 0) {
    return {
      stats: {
        season,
        rankings: [],
      },
    };
  }

  // Build team stats
  const teamStats = new Map<
    string,
    {
      wins: number;
      losses: number;
      pointsFor: number;
      pointsAgainst: number;
      games: number;
      lastTenRecord: number[];
    }
  >();

  for (const g of seasonGames) {
    const homeWon = g.homeScore > g.awayScore ? 1 : 0;
    const awayWon = g.awayScore > g.homeScore ? 1 : 0;

    const homeEntry = teamStats.get(g.homeTeamName) || {
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      games: 0,
      lastTenRecord: [],
    };
    homeEntry.wins += homeWon;
    homeEntry.losses += awayWon;
    homeEntry.pointsFor += g.homeScore;
    homeEntry.pointsAgainst += g.awayScore;
    homeEntry.games++;
    homeEntry.lastTenRecord.push(homeWon);
    teamStats.set(g.homeTeamName, homeEntry);

    const awayEntry = teamStats.get(g.awayTeamName) || {
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      games: 0,
      lastTenRecord: [],
    };
    awayEntry.wins += awayWon;
    awayEntry.losses += homeWon;
    awayEntry.pointsFor += g.awayScore;
    awayEntry.pointsAgainst += g.homeScore;
    awayEntry.games++;
    awayEntry.lastTenRecord.push(awayWon);
    teamStats.set(g.awayTeamName, awayEntry);
  }

  // Build SOS (strength of schedule) based on opponents' win percentages
  const sosMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [team, _stats] of teamStats) {
    let totalOppWinPct = 0;
    let opponentCount = 0;

    for (const g of seasonGames) {
      let opponent: string | null = null;
      if (g.homeTeamName === team) opponent = g.awayTeamName;
      else if (g.awayTeamName === team) opponent = g.homeTeamName;

      if (opponent) {
        const oppStats = teamStats.get(opponent);
        if (oppStats && oppStats.games > 0) {
          const oppWinPct = oppStats.wins / oppStats.games;
          totalOppWinPct += oppWinPct;
          opponentCount++;
        }
      }
    }

    sosMap.set(team, opponentCount > 0 ? totalOppWinPct / opponentCount : 0.5);
  }

  // Compute rankings
  const rankings: PowerRanking[] = [...teamStats.entries()]
    .map(([team, stats]) => {
      const games = stats.games;
      const winPct = games > 0 ? stats.wins / games : 0;
      const sos = sosMap.get(team) ?? 0.5;
      const pd = stats.pointsFor - stats.pointsAgainst;
      const lastTen = stats.lastTenRecord.slice(-10);
      const recentWins = lastTen.reduce((a, b) => a + b, 0);

      // Score: 40% win%, 20% SOS, 25% point diff, 15% recent form
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _score = winPct * 0.4 + sos * 0.2 + (pd > 0 ? Math.min(pd / 100, 1) : 0) * 0.25 + (recentWins / 10) * 0.15;

      return {
        rank: 0, // Will be assigned after sorting
        team,
        winPct: winPct.toFixed(3),
        sos: sos.toFixed(3),
        pointDifferential: pd.toFixed(0),
        recentForm: `${recentWins}-${lastTen.length - recentWins}`,
      };
    })
    .sort((a, b) => {
      const scoreA = parseFloat(a.winPct) * 0.4 + parseFloat(a.sos) * 0.2 + (parseFloat(a.pointDifferential) > 0 ? Math.min(parseFloat(a.pointDifferential) / 100, 1) : 0) * 0.25;
      const scoreB = parseFloat(b.winPct) * 0.4 + parseFloat(b.sos) * 0.2 + (parseFloat(b.pointDifferential) > 0 ? Math.min(parseFloat(b.pointDifferential) / 100, 1) : 0) * 0.25;
      return scoreB - scoreA;
    })
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  return {
    stats: {
      season,
      rankings,
    },
  };
}
