/**
 * Pure blowout analysis — no DB dependency.
 */

export interface BlowoutGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface Blowout {
  season: number;
  week: string;
  winner: string;
  loser: string;
  score: string;
  margin: number;
}

export interface BlowoutEra {
  era: string;
  blowouts: number;
  averageMargin: string;
  percentage: string;
}

export interface TeamBlowout {
  team: string;
  blowoutWins: number;
  blowoutLosses: number;
  total: number;
}

export interface BlowoutStats {
  totalBlowouts: number;
  biggestBlowouts: Blowout[];
  blowoutsByEra: BlowoutEra[];
  mostBlowoutWins: TeamBlowout[];
  mostBlowoutLosses: TeamBlowout[];
}

export interface BlowoutResult {
  stats: BlowoutStats;
}

function getEra(season: number): string {
  if (season < 2000) return "Pre-2000";
  if (season < 2010) return "2000-2009";
  if (season < 2020) return "2010-2019";
  return "2020+";
}

export function computeBlowouts(games: BlowoutGame[], threshold: number = 21): BlowoutResult {
  const blowoutGames = games.filter((g) => Math.abs(g.homeScore - g.awayScore) >= threshold);

  if (blowoutGames.length === 0) {
    return {
      stats: {
        totalBlowouts: 0,
        biggestBlowouts: [],
        blowoutsByEra: [],
        mostBlowoutWins: [],
        mostBlowoutLosses: [],
      },
    };
  }

  const blowouts: Blowout[] = blowoutGames.map((g) => {
    const margin = Math.abs(g.homeScore - g.awayScore);
    const winner = g.homeScore > g.awayScore ? g.homeTeamName : g.awayTeamName;
    const loser = g.homeScore > g.awayScore ? g.awayTeamName : g.homeTeamName;
    return {
      season: g.season,
      week: g.week,
      winner,
      loser,
      score: `${Math.max(g.homeScore, g.awayScore)}-${Math.min(g.homeScore, g.awayScore)}`,
      margin,
    };
  });

  const biggestBlowouts = blowouts.sort((a, b) => b.margin - a.margin).slice(0, 10);

  // Blowouts by era
  const eraMap = new Map<string, { count: number; margins: number[] }>();
  for (const b of blowouts) {
    const era = getEra(b.season);
    const entry = eraMap.get(era) || { count: 0, margins: [] };
    entry.count++;
    entry.margins.push(b.margin);
    eraMap.set(era, entry);
  }

  const blowoutsByEra = [...eraMap.entries()]
    .sort(([a], [b]) => {
      const orderMap: Record<string, number> = {
        "2020+": 3,
        "2010-2019": 2,
        "2000-2009": 1,
        "Pre-2000": 0,
      };
      return orderMap[b] - orderMap[a];
    })
    .map(([era, data]) => ({
      era,
      blowouts: data.count,
      averageMargin: (data.margins.reduce((a, b) => a + b, 0) / data.count).toFixed(1),
      percentage: ((data.count / blowoutGames.length) * 100).toFixed(1),
    }));

  // Team blowout stats
  const teamMap = new Map<string, { wins: number; losses: number }>();
  for (const b of blowouts) {
    const winEntry = teamMap.get(b.winner) || { wins: 0, losses: 0 };
    winEntry.wins++;
    teamMap.set(b.winner, winEntry);

    const lossEntry = teamMap.get(b.loser) || { wins: 0, losses: 0 };
    lossEntry.losses++;
    teamMap.set(b.loser, lossEntry);
  }

  const mostBlowoutWins: TeamBlowout[] = [...teamMap.entries()]
    .map(([team, data]) => ({
      team,
      blowoutWins: data.wins,
      blowoutLosses: data.losses,
      total: data.wins + data.losses,
    }))
    .sort((a, b) => b.blowoutWins - a.blowoutWins)
    .slice(0, 10);

  const mostBlowoutLosses: TeamBlowout[] = [...teamMap.entries()]
    .map(([team, data]) => ({
      team,
      blowoutWins: data.wins,
      blowoutLosses: data.losses,
      total: data.wins + data.losses,
    }))
    .sort((a, b) => b.blowoutLosses - a.blowoutLosses)
    .slice(0, 10);

  return {
    stats: {
      totalBlowouts: blowouts.length,
      biggestBlowouts,
      blowoutsByEra,
      mostBlowoutWins,
      mostBlowoutLosses,
    },
  };
}
