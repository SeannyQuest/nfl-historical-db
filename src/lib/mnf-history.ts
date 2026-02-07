/**
 * Pure Monday Night Football history — no DB dependency.
 */

export interface MNFGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  primetime: string | null;
}

export interface TeamMNFRecord {
  team: string;
  mnfWins: number;
  mnfLosses: number;
  mnfTies: number;
  winPct: string;
}

export interface HighScoringMNF {
  season: number;
  week: string;
  homeTeam: string;
  awayTeam: string;
  score: string;
  total: number;
}

export interface MNFEraStats {
  era: string;
  games: number;
  totalPoints: number;
  averagePoints: string;
}

export interface MNFUpset {
  season: number;
  week: string;
  underdog: string;
  favorite: string;
  score: string;
}

export interface MNFStats {
  totalMNFGames: number;
  bestMNFTeams: TeamMNFRecord[];
  worstMNFTeams: TeamMNFRecord[];
  highestScoringMNF: HighScoringMNF[];
  mnfByEra: MNFEraStats[];
  mnfUpsets: MNFUpset[];
}

export interface MNFResult {
  stats: MNFStats;
}

function getEra(season: number): string {
  if (season < 2000) return "Pre-2000";
  if (season < 2010) return "2000-2009";
  if (season < 2020) return "2010-2019";
  return "2020+";
}

export function computeMnfHistory(games: MNFGame[]): MNFResult {
  const mnfGames = games.filter((g) => g.primetime === "MNF");

  if (mnfGames.length === 0) {
    return {
      stats: {
        totalMNFGames: 0,
        bestMNFTeams: [],
        worstMNFTeams: [],
        highestScoringMNF: [],
        mnfByEra: [],
        mnfUpsets: [],
      },
    };
  }

  // Team MNF records
  const teamMap = new Map<string, { wins: number; losses: number; ties: number }>();
  const highScoring: HighScoringMNF[] = [];
  const eraMap = new Map<string, { games: number; points: number[] }>();

  for (const g of mnfGames) {
    const total = g.homeScore + g.awayScore;
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    // Update team records
    const homeEntry = teamMap.get(g.homeTeamName) || { wins: 0, losses: 0, ties: 0 };
    const awayEntry = teamMap.get(g.awayTeamName) || { wins: 0, losses: 0, ties: 0 };

    if (homeWon) {
      homeEntry.wins++;
      awayEntry.losses++;
    } else if (awayWon) {
      awayEntry.wins++;
      homeEntry.losses++;
    } else {
      homeEntry.ties++;
      awayEntry.ties++;
    }

    teamMap.set(g.homeTeamName, homeEntry);
    teamMap.set(g.awayTeamName, awayEntry);

    // Collect high-scoring games
    highScoring.push({
      season: g.season,
      week: g.week,
      homeTeam: g.homeTeamName,
      awayTeam: g.awayTeamName,
      score: `${g.homeScore}-${g.awayScore}`,
      total,
    });

    // Track era stats
    const era = getEra(g.season);
    const eraEntry = eraMap.get(era) || { games: 0, points: [] };
    eraEntry.games++;
    eraEntry.points.push(total);
    eraMap.set(era, eraEntry);
  }

  // Best and worst MNF teams
  const teamRecords: TeamMNFRecord[] = [...teamMap.entries()].map(([team, record]) => {
    const decisions = record.wins + record.losses;
    return {
      team,
      mnfWins: record.wins,
      mnfLosses: record.losses,
      mnfTies: record.ties,
      winPct: decisions > 0 ? (record.wins / decisions).toFixed(3) : ".000",
    };
  });

  const bestMNFTeams = teamRecords
    .sort((a, b) => parseFloat(b.winPct) - parseFloat(a.winPct))
    .slice(0, 10);

  const worstMNFTeams = teamRecords
    .sort((a, b) => parseFloat(a.winPct) - parseFloat(b.winPct))
    .slice(0, 10);

  // Highest scoring MNF games
  const highestScoringMNF = highScoring
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // MNF by era
  const mnfByEra = [...eraMap.entries()]
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
      games: data.games,
      totalPoints: data.points.reduce((a, b) => a + b, 0),
      averagePoints: (data.points.reduce((a, b) => a + b, 0) / data.games).toFixed(1),
    }));

  // MNF upsets: assume games with larger point spreads are upsets
  // Simple heuristic: close games where lower-seeded team (alphabetically) wins
  const mnfUpsets: MNFUpset[] = mnfGames
    .filter((g) => {
      const margin = Math.abs(g.homeScore - g.awayScore);
      return margin >= 3 && margin <= 7;
    })
    .slice(0, 10)
    .map((g) => {
      const underdog = g.homeTeamName < g.awayTeamName ? g.homeTeamName : g.awayTeamName;
      const favorite = g.homeTeamName >= g.awayTeamName ? g.homeTeamName : g.awayTeamName;
      return {
        season: g.season,
        week: g.week,
        underdog,
        favorite,
        score: `${g.homeScore}-${g.awayScore}`,
      };
    });

  return {
    stats: {
      totalMNFGames: mnfGames.length,
      bestMNFTeams,
      worstMNFTeams,
      highestScoringMNF,
      mnfByEra,
      mnfUpsets,
    },
  };
}
