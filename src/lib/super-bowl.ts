/**
 * Pure Super Bowl history and stats computation — no DB dependency.
 * Operates on arrays of game-like objects to compute Super Bowl analytics.
 */

export interface SuperBowlGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  spreadResult: string | null;
  ouResult: string | null;
}

export interface ChampionByYear {
  season: number;
  champion: string;
  score: string;
  opponent: string;
  spread: string;
}

export interface Blowout {
  season: number;
  score: string;
  margin: number;
  winner: string;
  loser: string;
}

export interface ClosestGame {
  season: number;
  score: string;
  margin: number;
  winner: string;
  loser: string;
}

export interface Appearance {
  team: string;
  count: number;
  wins: number;
  losses: number;
}

export interface DynastyTeam {
  team: string;
  wins: number;
  appearances: number;
  winPct: string;
  era: string;
}

export interface SuperBowlStats {
  totalSuperBowls: number;
  championsByYear: ChampionByYear[];
  biggestBlowouts: Blowout[];
  closestGames: ClosestGame[];
  mostAppearances: Appearance[];
  dynastyTracker: DynastyTeam[];
}

export interface SuperBowlResult {
  stats: SuperBowlStats;
}

export function computeSuperBowlStats(games: SuperBowlGame[]): SuperBowlResult {
  // Filter for Super Bowl games only
  const sbGames = games.filter((g) => g.week === "SuperBowl");

  if (sbGames.length === 0) {
    return {
      stats: {
        totalSuperBowls: 0,
        championsByYear: [],
        biggestBlowouts: [],
        closestGames: [],
        mostAppearances: [],
        dynastyTracker: [],
      },
    };
  }

  // Champions by year
  const championsByYear: ChampionByYear[] = sbGames
    .map((g) => {
      const winner = g.homeScore > g.awayScore ? g.homeTeamName : g.awayTeamName;
      const loser = g.homeScore > g.awayScore ? g.awayTeamName : g.homeTeamName;
      const margin = Math.abs(g.homeScore - g.awayScore);
      return {
        season: g.season,
        champion: winner,
        score: `${Math.max(g.homeScore, g.awayScore)}-${Math.min(g.homeScore, g.awayScore)}`,
        opponent: loser,
        spread: margin > 0 ? `${margin > 0 ? "+" : ""}${margin}` : "TIE",
      };
    })
    .sort((a, b) => b.season - a.season);

  // Blowouts
  const blowouts: Blowout[] = sbGames
    .map((g) => {
      const margin = Math.abs(g.homeScore - g.awayScore);
      const winner = g.homeScore > g.awayScore ? g.homeTeamName : g.awayTeamName;
      const loser = g.homeScore > g.awayScore ? g.awayTeamName : g.homeTeamName;
      return { season: g.season, score: `${g.homeScore}-${g.awayScore}`, margin, winner, loser };
    })
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);

  // Closest games
  const closestGames: ClosestGame[] = sbGames
    .map((g) => {
      const margin = Math.abs(g.homeScore - g.awayScore);
      const winner = g.homeScore > g.awayScore ? g.homeTeamName : g.awayTeamName;
      const loser = g.homeScore > g.awayScore ? g.awayTeamName : g.homeTeamName;
      return { season: g.season, score: `${g.homeScore}-${g.awayScore}`, margin, winner, loser };
    })
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 5);

  // Most appearances
  const appearanceMap = new Map<
    string,
    { wins: number; losses: number; count: number }
  >();
  for (const g of sbGames) {
    const homeEntry = appearanceMap.get(g.homeTeamName) || { wins: 0, losses: 0, count: 0 };
    const awayEntry = appearanceMap.get(g.awayTeamName) || { wins: 0, losses: 0, count: 0 };

    if (g.homeScore > g.awayScore) {
      homeEntry.wins++;
      awayEntry.losses++;
    } else if (g.awayScore > g.homeScore) {
      awayEntry.wins++;
      homeEntry.losses++;
    }

    homeEntry.count++;
    awayEntry.count++;

    appearanceMap.set(g.homeTeamName, homeEntry);
    appearanceMap.set(g.awayTeamName, awayEntry);
  }

  const mostAppearances: Appearance[] = [...appearanceMap.entries()]
    .map(([team, data]) => ({
      team,
      count: data.count,
      wins: data.wins,
      losses: data.losses,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Dynasty tracker: group by era (pre-2000, 2000-2009, 2010-2019, 2020+)
  const dynastyMap = new Map<string, { wins: number; appearances: number; eras: Set<string> }>();
  for (const g of sbGames) {
    const era =
      g.season < 2000 ? "Pre-2000" : g.season < 2010 ? "2000-2009" : g.season < 2020 ? "2010-2019" : "2020+";

    const homeEntry = dynastyMap.get(g.homeTeamName) || { wins: 0, appearances: 0, eras: new Set() };
    const awayEntry = dynastyMap.get(g.awayTeamName) || { wins: 0, appearances: 0, eras: new Set() };

    if (g.homeScore > g.awayScore) {
      homeEntry.wins++;
      awayEntry.appearances++;
    } else if (g.awayScore > g.homeScore) {
      awayEntry.wins++;
      homeEntry.appearances++;
    } else {
      homeEntry.appearances++;
      awayEntry.appearances++;
    }

    homeEntry.eras.add(era);
    awayEntry.eras.add(era);
    homeEntry.appearances++;
    awayEntry.appearances++;

    dynastyMap.set(g.homeTeamName, homeEntry);
    dynastyMap.set(g.awayTeamName, awayEntry);
  }

  const dynastyTracker: DynastyTeam[] = [...dynastyMap.entries()]
    .map(([team, data]) => ({
      team,
      wins: data.wins,
      appearances: data.appearances,
      winPct: data.appearances > 0 ? (data.wins / data.appearances).toFixed(3) : ".000",
      era: [...data.eras].join("/"),
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  return {
    stats: {
      totalSuperBowls: sbGames.length,
      championsByYear,
      biggestBlowouts: blowouts,
      closestGames,
      mostAppearances,
      dynastyTracker,
    },
  };
}
