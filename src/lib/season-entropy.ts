/**
 * Pure season entropy calculation — no DB dependency.
 * Measures competitive parity using Shannon entropy and Gini coefficient.
 */

export interface EntropyGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface SeasonEntropyRecord {
  season: number;
  entropy: number;
  numTeams: number;
  maxEntropy: number;
  parityIndex: number;
}

export interface WinDistributionRecord {
  season: number;
  giniCoefficient: number;
}

export interface SeasonEntropyResult {
  seasonEntropy: SeasonEntropyRecord[];
  mostCompetitiveSeasons: SeasonEntropyRecord[];
  leastCompetitiveSeasons: SeasonEntropyRecord[];
  winDistribution: WinDistributionRecord[];
}

export function computeSeasonEntropy(
  games: EntropyGame[]
): SeasonEntropyResult {
  if (games.length === 0) {
    return {
      seasonEntropy: [],
      mostCompetitiveSeasons: [],
      leastCompetitiveSeasons: [],
      winDistribution: [],
    };
  }

  // Compute team win counts by season
  interface TeamWinData {
    wins: number;
    losses: number;
  }

  const seasonTeamMap = new Map<
    number,
    Map<string, TeamWinData>
  >();

  for (const g of games) {
    if (!seasonTeamMap.has(g.season)) {
      seasonTeamMap.set(g.season, new Map());
    }

    const teamMap = seasonTeamMap.get(g.season)!;

    if (!teamMap.has(g.homeTeamName)) {
      teamMap.set(g.homeTeamName, { wins: 0, losses: 0 });
    }
    if (!teamMap.has(g.awayTeamName)) {
      teamMap.set(g.awayTeamName, { wins: 0, losses: 0 });
    }

    const homeData = teamMap.get(g.homeTeamName)!;
    const awayData = teamMap.get(g.awayTeamName)!;

    if (g.homeScore > g.awayScore) {
      homeData.wins++;
      awayData.losses++;
    } else {
      homeData.losses++;
      awayData.wins++;
    }
  }

  // Calculate entropy and Gini for each season
  const seasonEntropy: SeasonEntropyRecord[] = [];
  const winDistribution: WinDistributionRecord[] = [];

  for (const [season, teamMap] of seasonTeamMap.entries()) {
    const teams = Array.from(teamMap.values());
    const numTeams = teams.length;

    if (numTeams === 0) continue;

    // Calculate win percentages
    const winPcts: number[] = [];
    for (const team of teams) {
      const total = team.wins + team.losses;
      const pct = total > 0 ? team.wins / total : 0;
      winPcts.push(pct);
    }

    // Shannon entropy: H = -sum(p_i * log2(p_i))
    let entropy = 0;
    for (const pct of winPcts) {
      if (pct > 0 && pct < 1) {
        entropy -= pct * Math.log2(pct);
      }
    }

    // Maximum entropy = log2(numTeams) for uniform distribution
    const maxEntropy = Math.log2(numTeams);

    // Parity index = entropy / maxEntropy (0 = no parity, 1 = perfect parity)
    const parityIndex =
      maxEntropy > 0 ? Math.round((entropy / maxEntropy) * 10000) / 10000 : 0;

    seasonEntropy.push({
      season,
      entropy: Math.round(entropy * 10000) / 10000,
      numTeams,
      maxEntropy: Math.round(maxEntropy * 10000) / 10000,
      parityIndex,
    });

    // Gini coefficient: measures inequality in win distribution
    const sortedPcts = [...winPcts].sort((a, b) => a - b);
    let sumDiff = 0;
    const mean = sortedPcts.reduce((a, b) => a + b, 0) / numTeams;

    for (let i = 0; i < sortedPcts.length; i++) {
      for (let j = 0; j < sortedPcts.length; j++) {
        sumDiff += Math.abs(sortedPcts[i] - sortedPcts[j]);
      }
    }

    const gini =
      mean > 0 && numTeams > 0
        ? sumDiff / (2 * numTeams * numTeams * mean)
        : 0;

    winDistribution.push({
      season,
      giniCoefficient: Math.round(Math.max(0, gini) * 10000) / 10000,
    });
  }

  // Sort by parity descending
  seasonEntropy.sort((a, b) => b.parityIndex - a.parityIndex);

  // Top 5 most competitive
  const mostCompetitiveSeasons = seasonEntropy.slice(0, 5);

  // Bottom 5 least competitive
  const leastCompetitiveSeasons = seasonEntropy.slice(-5).reverse();

  // Sort win distribution by season for output
  winDistribution.sort((a, b) => a.season - b.season);

  return {
    seasonEntropy: seasonEntropy.sort((a, b) => b.season - a.season),
    mostCompetitiveSeasons,
    leastCompetitiveSeasons,
    winDistribution,
  };
}
