/**
 * Pure comeback computation — no DB dependency.
 * Operates on arrays of game-like objects to compute comeback analytics.
 */

export interface ComebackGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface Comeback {
  season: number;
  week: string;
  team: string;
  opponent: string;
  finalScore: string;
  deficit: number;
  score: string;
}

export interface ComebackEra {
  era: string;
  comebacks: number;
  averageDeficit: string;
}

export interface TeamComebacks {
  team: string;
  comebacks: number;
  winRate: string;
}

export interface ComebackStats {
  totalComebacks: number;
  biggestComebacks: Comeback[];
  comebackWinRate: string;
  comebacksByEra: ComebackEra[];
  bestComebackTeams: TeamComebacks[];
}

export interface ComebackResult {
  stats: ComebackStats;
}

function getEra(season: number): string {
  if (season < 2000) return "Pre-2000";
  if (season < 2010) return "2000-2009";
  if (season < 2020) return "2010-2019";
  return "2020+";
}

export function computeCombacks(games: ComebackGame[]): ComebackResult {
  // Identify comebacks: team was behind at some point, won by >0
  const comebacks: Comeback[] = [];
  const teamComebackMap = new Map<string, { count: number; games: number }>();

  // We'll assume a simple heuristic: if scoreDiff (home - away) is meaningful,
  // a comeback happened if the trailing team won. We track "biggest" by how much they overcame.
  // Since we don't have play-by-play data, we'll track teams that won despite lower score expectations.

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (!homeWon && !awayWon) continue; // Skip ties

    // Calculate the score differential that had to be overcome
    const scoreDiff = Math.abs(g.homeScore - g.awayScore);

    // Heuristic: a comeback is a close game (margin 1-7 points) where trailing team won
    // This is a simplification without quarter-by-quarter data
    if (scoreDiff <= 7 && scoreDiff > 0) {
      if (homeWon) {
        comebacks.push({
          season: g.season,
          week: g.week,
          team: g.homeTeamName,
          opponent: g.awayTeamName,
          finalScore: `${g.homeScore}-${g.awayScore}`,
          deficit: scoreDiff,
          score: `${g.homeScore}-${g.awayScore}`,
        });

        const hEntry = teamComebackMap.get(g.homeTeamName) || { count: 0, games: 0 };
        hEntry.count++;
        hEntry.games++;
        teamComebackMap.set(g.homeTeamName, hEntry);
      }
      if (awayWon) {
        comebacks.push({
          season: g.season,
          week: g.week,
          team: g.awayTeamName,
          opponent: g.homeTeamName,
          finalScore: `${g.awayScore}-${g.homeScore}`,
          deficit: scoreDiff,
          score: `${g.awayScore}-${g.homeScore}`,
        });

        const aEntry = teamComebackMap.get(g.awayTeamName) || { count: 0, games: 0 };
        aEntry.count++;
        aEntry.games++;
        teamComebackMap.set(g.awayTeamName, aEntry);
      }
    }
  }

  // Biggest comebacks: sort by deficit
  const biggestComebacks = comebacks.sort((a, b) => b.deficit - a.deficit).slice(0, 10);

  // Comeback win rate: Total comebacks / total close games
  const totalCloseGames = games.filter(
    (g) => Math.abs(g.homeScore - g.awayScore) <= 7 && g.homeScore !== g.awayScore
  ).length;
  const comebackWinRate =
    totalCloseGames > 0 ? (comebacks.length / totalCloseGames).toFixed(3) : ".000";

  // Comebacks by era
  const eraMap = new Map<
    string,
    { comebacks: number; deficits: number[] }
  >();
  for (const c of comebacks) {
    const era = getEra(c.season);
    const entry = eraMap.get(era) || { comebacks: 0, deficits: [] };
    entry.comebacks++;
    entry.deficits.push(c.deficit);
    eraMap.set(era, entry);
  }

  const comebacksByEra: ComebackEra[] = [
    ...eraMap.entries(),
  ]
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
      comebacks: data.comebacks,
      averageDeficit:
        data.deficits.length > 0
          ? (data.deficits.reduce((a, b) => a + b, 0) / data.deficits.length).toFixed(1)
          : "0.0",
    }));

  // Best comeback teams
  const bestComebackTeams: TeamComebacks[] = [...teamComebackMap.entries()]
    .map(([team, data]) => ({
      team,
      comebacks: data.count,
      winRate: (data.count / data.games).toFixed(3),
    }))
    .sort((a, b) => b.comebacks - a.comebacks)
    .slice(0, 10);

  return {
    stats: {
      totalComebacks: comebacks.length,
      biggestComebacks,
      comebackWinRate,
      comebacksByEra,
      bestComebackTeams,
    },
  };
}
