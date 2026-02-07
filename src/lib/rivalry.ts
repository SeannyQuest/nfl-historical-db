/**
 * Pure rivalry computation — no DB dependency.
 * Operates on arrays of game-like objects to identify and analyze rivalries.
 */

export interface RivalryGame {
  date: string;
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  homeTeamDivision: string | null;
  awayTeamDivision: string | null;
}

export interface RivalryEntry {
  team1: string;
  team2: string;
  totalGames: number;
  team1Wins: number;
  team2Wins: number;
  ties: number;
  avgTotal: string;
  lastGame: {
    date: string;
    season: number;
    homeTeam: string;
    awayTeam: string;
    score: string;
    winner: string | null;
  };
}

export interface RivalriesResult {
  mostPlayedMatchups: RivalryEntry[];
  closestRivalries: RivalryEntry[];
  highestScoringRivalries: RivalryEntry[];
  divisionRivalries: RivalryEntry[];
}

function makeMatchupKey(team1: string, team2: string): string {
  const sorted = [team1, team2].sort();
  return sorted.join("|");
}

function parseMatchupKey(key: string): [string, string] {
  const [t1, t2] = key.split("|");
  return [t1, t2];
}

export function identifyRivalries(games: RivalryGame[]): RivalriesResult {
  if (games.length === 0) {
    return {
      mostPlayedMatchups: [],
      closestRivalries: [],
      highestScoringRivalries: [],
      divisionRivalries: [],
    };
  }

  // Map to track all matchups
  const matchupMap = new Map<
    string,
    {
      team1: string;
      team2: string;
      team1Wins: number;
      team2Wins: number;
      ties: number;
      totalGames: number;
      totalPoints: number;
      lastGame: {
        date: string;
        season: number;
        homeTeam: string;
        awayTeam: string;
        score: string;
        winner: string | null;
      };
      isDivision: boolean;
    }
  >();

  for (const g of games) {
    const key = makeMatchupKey(g.homeTeamName, g.awayTeamName);

    if (!matchupMap.has(key)) {
      const [t1, t2] = parseMatchupKey(key);
      const isDivision = Boolean(
        g.homeTeamDivision &&
        g.awayTeamDivision &&
        g.homeTeamDivision === g.awayTeamDivision
      );

      matchupMap.set(key, {
        team1: t1,
        team2: t2,
        team1Wins: 0,
        team2Wins: 0,
        ties: 0,
        totalGames: 0,
        totalPoints: 0,
        lastGame: {
          date: "",
          season: 0,
          homeTeam: "",
          awayTeam: "",
          score: "",
          winner: null,
        },
        isDivision,
      });
    }

    const entry = matchupMap.get(key)!;
    entry.totalGames++;
    entry.totalPoints += g.homeScore + g.awayScore;

    // Update last game
    entry.lastGame = {
      date: g.date,
      season: g.season,
      homeTeam: g.homeTeamName,
      awayTeam: g.awayTeamName,
      score: `${g.awayScore}-${g.homeScore}`,
      winner: g.winnerName,
    };

    // Update wins
    if (g.winnerName === entry.team1) {
      entry.team1Wins++;
    } else if (g.winnerName === entry.team2) {
      entry.team2Wins++;
    } else {
      entry.ties++;
    }
  }

  // Convert to result entries
  const allRivalries: RivalryEntry[] = [...matchupMap.entries()].map(([, data]) => ({
    team1: data.team1,
    team2: data.team2,
    totalGames: data.totalGames,
    team1Wins: data.team1Wins,
    team2Wins: data.team2Wins,
    ties: data.ties,
    avgTotal: (data.totalPoints / data.totalGames).toFixed(1),
    lastGame: data.lastGame,
  }));

  // Most played matchups
  const mostPlayedMatchups = [...allRivalries]
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 15);

  // Closest rivalries (smallest win% difference)
  const closestRivalries = [...allRivalries]
    .filter((r) => r.totalGames >= 2) // At least 2 games
    .map((r) => {
      const t1Pct = r.totalGames > 0 ? r.team1Wins / r.totalGames : 0;
      const winDiff = Math.abs(t1Pct - (1 - t1Pct));
      return { ...r, winDiff };
    })
    .sort((a, b) => a.winDiff - b.winDiff)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ winDiff: _winDiff, ...r }) => r)
    .slice(0, 15);

  // Highest scoring rivalries
  const highestScoringRivalries = [...allRivalries]
    .sort((a, b) => parseFloat(b.avgTotal) - parseFloat(a.avgTotal))
    .slice(0, 15);

  // Division rivalries
  const divisionRivalries = [...allRivalries]
    .filter((r) => {
      // Check if this matchup is in division by looking at remaining games
      const relatedGames = games.filter(
        (g) =>
          (g.homeTeamName === r.team1 && g.awayTeamName === r.team2) ||
          (g.homeTeamName === r.team2 && g.awayTeamName === r.team1)
      );
      return (
        relatedGames.length > 0 &&
        relatedGames[0].homeTeamDivision &&
        relatedGames[0].awayTeamDivision &&
        relatedGames[0].homeTeamDivision === relatedGames[0].awayTeamDivision
      );
    })
    .sort((a, b) => b.totalGames - a.totalGames)
    .slice(0, 15);

  return {
    mostPlayedMatchups,
    closestRivalries,
    highestScoringRivalries,
    divisionRivalries,
  };
}
