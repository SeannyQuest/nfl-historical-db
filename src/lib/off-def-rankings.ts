/**
 * Pure function for computing offensive vs defensive rankings — no DB dependency.
 * Analyzes team scoring and allows-against to rank offenses and defenses.
 */

export interface OffDefGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamRanking {
  team: string;
  season: number;
  offRank: number;
  defRank: number;
  overallRank: number;
  ptsPerGame: string;
  ptsAllowedPerGame: string;
}

export interface SeasonBest {
  season: number;
  bestOffense: string;
  bestDefense: string;
}

export interface OffDefResult {
  teamRankings: TeamRanking[];
  bestOffenses: TeamRanking[];
  bestDefenses: TeamRanking[];
  balancedTeams: TeamRanking[];
  seasonBest: SeasonBest[];
}

export function computeOffDefRankings(games: OffDefGame[]): OffDefResult {
  // Build team stats per season
  const seasonTeamStats = new Map<
    string,
    Map<
      string,
      {
        games: number;
        ptsFor: number;
        ptsAgainst: number;
      }
    >
  >();

  for (const g of games) {
    const seasonKey = g.season.toString();
    if (!seasonTeamStats.has(seasonKey)) {
      seasonTeamStats.set(seasonKey, new Map());
    }
    const teamStatsMap = seasonTeamStats.get(seasonKey)!;

    // Home team
    if (!teamStatsMap.has(g.homeTeamName)) {
      teamStatsMap.set(g.homeTeamName, {
        games: 0,
        ptsFor: 0,
        ptsAgainst: 0,
      });
    }
    const homeStats = teamStatsMap.get(g.homeTeamName)!;
    homeStats.games++;
    homeStats.ptsFor += g.homeScore;
    homeStats.ptsAgainst += g.awayScore;

    // Away team
    if (!teamStatsMap.has(g.awayTeamName)) {
      teamStatsMap.set(g.awayTeamName, {
        games: 0,
        ptsFor: 0,
        ptsAgainst: 0,
      });
    }
    const awayStats = teamStatsMap.get(g.awayTeamName)!;
    awayStats.games++;
    awayStats.ptsFor += g.awayScore;
    awayStats.ptsAgainst += g.homeScore;
  }

  // Convert to rankings
  const teamRankings: TeamRanking[] = [];
  const seasonBestMap = new Map<
    number,
    { bestOff: string; bestOffPPG: number; bestDef: string; bestDefPPAG: number }
  >();

  for (const [seasonStr, teamStatsMap] of seasonTeamStats) {
    const season = parseInt(seasonStr, 10);
    const seasonTeamRankings: (TeamRanking & { season: number; ptsForPerGame: number; ptsAgainstPerGame: number })[] = [];

    for (const [team, stats] of teamStatsMap) {
      const ptsPerGame = stats.ptsFor / stats.games;
      const ptsAllowedPerGame = stats.ptsAgainst / stats.games;

      seasonTeamRankings.push({
        team,
        season,
        ptsForPerGame: ptsPerGame,
        ptsAgainstPerGame: ptsAllowedPerGame,
        offRank: 0, // Will be assigned after sorting
        defRank: 0,
        overallRank: 0,
        ptsPerGame: ptsPerGame.toFixed(2),
        ptsAllowedPerGame: ptsAllowedPerGame.toFixed(2),
      });
    }

    // Assign offensive rankings (1 = best)
    const offRanked = [...seasonTeamRankings].sort((a, b) => b.ptsForPerGame - a.ptsForPerGame);
    offRanked.forEach((team, idx) => {
      seasonTeamRankings.find(t => t.team === team.team)!.offRank = idx + 1;
    });

    // Assign defensive rankings (1 = best defense = lowest ppag)
    const defRanked = [...seasonTeamRankings].sort((a, b) => a.ptsAgainstPerGame - b.ptsAgainstPerGame);
    defRanked.forEach((team, idx) => {
      seasonTeamRankings.find(t => t.team === team.team)!.defRank = idx + 1;
    });

    // Assign overall rankings
    const overallRanked = [...seasonTeamRankings].sort(
      (a, b) => (a.offRank + a.defRank) / 2 - (b.offRank + b.defRank) / 2
    );
    overallRanked.forEach((team, idx) => {
      seasonTeamRankings.find(t => t.team === team.team)!.overallRank = idx + 1;
    });

    // Track season best
    const bestOff = offRanked[0];
    const bestDef = defRanked[0];
    seasonBestMap.set(season, {
      bestOff: bestOff.team,
      bestOffPPG: bestOff.ptsForPerGame,
      bestDef: bestDef.team,
      bestDefPPAG: bestDef.ptsAgainstPerGame,
    });

    teamRankings.push(...seasonTeamRankings);
  }

  // Best offenses: top 10 by ptsPerGame across all seasons
  const bestOffenses = [...teamRankings]
    .sort((a, b) => parseFloat(b.ptsPerGame) - parseFloat(a.ptsPerGame))
    .slice(0, 10);

  // Best defenses: top 10 by lowest ptsAllowedPerGame
  const bestDefenses = [...teamRankings]
    .sort((a, b) => parseFloat(a.ptsAllowedPerGame) - parseFloat(b.ptsAllowedPerGame))
    .slice(0, 10);

  // Balanced teams: |offRank - defRank| <= 3
  const balancedTeams = teamRankings.filter(t => Math.abs(t.offRank - t.defRank) <= 3);

  // Season best
  const seasonBest: SeasonBest[] = Array.from(seasonBestMap.entries())
    .map(([season, data]) => ({
      season,
      bestOffense: data.bestOff,
      bestDefense: data.bestDef,
    }))
    .sort((a, b) => a.season - b.season);

  return {
    teamRankings,
    bestOffenses,
    bestDefenses,
    balancedTeams,
    seasonBest,
  };
}
