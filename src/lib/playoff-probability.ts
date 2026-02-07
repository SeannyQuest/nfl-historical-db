/**
 * Pure playoff probability calculator — no DB dependency.
 */

export interface PPGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface PlayoffProbability {
  team: string;
  wins: number;
  losses: number;
  playoffProb: string;
  comment: string;
}

export interface PlayoffProbabilityStats {
  season: number;
  probabilities: PlayoffProbability[];
}

export interface PlayoffProbabilityResult {
  stats: PlayoffProbabilityStats;
}

export function computePlayoffProbability(
  games: PPGame[],
  teams: string[],
  season: number
): PlayoffProbabilityResult {
  const seasonGames = games.filter((g) => g.season === season);

  if (seasonGames.length === 0) {
    return {
      stats: {
        season,
        probabilities: [],
      },
    };
  }

  // Build team records
  const teamRecords = new Map<
    string,
    { wins: number; losses: number; gamesPlayed: number }
  >();

  for (const team of teams) {
    teamRecords.set(team, { wins: 0, losses: 0, gamesPlayed: 0 });
  }

  for (const g of seasonGames) {
    const homeRecord = teamRecords.get(g.homeTeamName);
    const awayRecord = teamRecords.get(g.awayTeamName);

    if (!homeRecord || !awayRecord) continue;

    homeRecord.gamesPlayed++;
    awayRecord.gamesPlayed++;

    if (g.homeScore > g.awayScore) {
      homeRecord.wins++;
      awayRecord.losses++;
    } else if (g.awayScore > g.homeScore) {
      awayRecord.wins++;
      homeRecord.losses++;
    } else {
      homeRecord.wins += 0.5;
      awayRecord.wins += 0.5;
    }
  }

  // Simple playoff probability heuristic:
  // - 12+ wins: 99%
  // - 10-11 wins: 75%
  // - 8-9 wins: 25%
  // - 7 wins or less: 5%
  const probabilities: PlayoffProbability[] = [...teamRecords.entries()]
    .map(([team, record]) => {
      let prob = "0.050";
      let comment = "Unlikely";

      if (record.wins >= 12) {
        prob = "0.990";
        comment = "Clinched";
      } else if (record.wins >= 10) {
        prob = "0.750";
        comment = "Likely";
      } else if (record.wins >= 8) {
        prob = "0.250";
        comment = "Possible";
      } else if (record.wins >= 7) {
        prob = "0.050";
        comment = "Long shot";
      }

      return {
        team,
        wins: Math.floor(record.wins),
        losses: record.losses,
        playoffProb: prob,
        comment,
      };
    })
    .sort((a, b) => b.wins - a.wins);

  return {
    stats: {
      season,
      probabilities,
    },
  };
}
