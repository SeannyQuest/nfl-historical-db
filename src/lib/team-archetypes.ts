/**
 * Pure team archetypes classifier — no DB dependency.
 * Classifies teams based on scoring and defensive patterns.
 */

export interface ArchetypeGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamArchetypeRecord {
  team: string;
  season: number;
  archetype: string;
  ptsPerGame: number;
  ptsAllowedPerGame: number;
}

export interface ArchetypeWinRate {
  archetype: string;
  avgWinPct: number;
  teams: number;
}

export interface ArchetypeDistribution {
  archetype: string;
  count: number;
  pct: number;
}

export interface TeamArchetypesResult {
  teamArchetypes: TeamArchetypeRecord[];
  archetypeWinRates: ArchetypeWinRate[];
  archetypeDistribution: ArchetypeDistribution[];
}

export function computeTeamArchetypes(
  games: ArchetypeGame[]
): TeamArchetypesResult {
  if (games.length === 0) {
    return {
      teamArchetypes: [],
      archetypeWinRates: [],
      archetypeDistribution: [],
    };
  }

  // Build team stats by season
  interface TeamSeasonStats {
    wins: number;
    losses: number;
    ptsFor: number;
    ptsAgainst: number;
    gameCount: number;
  }

  const teamStatsMap = new Map<
    string,
    Map<number, TeamSeasonStats>
  >();

  for (const g of games) {
    const homeKey = `${g.homeTeamName}|${g.season}`;
    const awayKey = `${g.awayTeamName}|${g.season}`;

    if (!teamStatsMap.has(homeKey)) {
      teamStatsMap.set(homeKey, new Map());
    }
    if (!teamStatsMap.has(awayKey)) {
      teamStatsMap.set(awayKey, new Map());
    }

    let homeStats = teamStatsMap.get(homeKey)!.get(g.season);
    if (!homeStats) {
      homeStats = { wins: 0, losses: 0, ptsFor: 0, ptsAgainst: 0, gameCount: 0 };
      teamStatsMap.get(homeKey)!.set(g.season, homeStats);
    }

    let awayStats = teamStatsMap.get(awayKey)!.get(g.season);
    if (!awayStats) {
      awayStats = { wins: 0, losses: 0, ptsFor: 0, ptsAgainst: 0, gameCount: 0 };
      teamStatsMap.get(awayKey)!.set(g.season, awayStats);
    }

    homeStats.ptsFor += g.homeScore;
    homeStats.ptsAgainst += g.awayScore;
    homeStats.gameCount++;

    awayStats.ptsFor += g.awayScore;
    awayStats.ptsAgainst += g.homeScore;
    awayStats.gameCount++;

    if (g.homeScore > g.awayScore) {
      homeStats.wins++;
      awayStats.losses++;
    } else {
      homeStats.losses++;
      awayStats.wins++;
    }
  }

  // Flatten to season records
  interface SeasonRecord {
    team: string;
    season: number;
    ptsPerGame: number;
    ptsAllowedPerGame: number;
    winPct: number;
  }

  const seasonRecords: SeasonRecord[] = [];
  teamStatsMap.forEach((seasonMap, key) => {
    seasonMap.forEach((stats, season) => {
      if (stats.gameCount > 0) {
        const ptsPerGame =
          Math.round((stats.ptsFor / stats.gameCount) * 100) / 100;
        const ptsAllowedPerGame =
          Math.round((stats.ptsAgainst / stats.gameCount) * 100) / 100;
        const winPct =
          stats.wins + stats.losses > 0
            ? Math.round(
                (stats.wins / (stats.wins + stats.losses)) * 10000
              ) / 10000
            : 0;

        seasonRecords.push({
          team: key.split("|")[0],
          season,
          ptsPerGame,
          ptsAllowedPerGame,
          winPct,
        });
      }
    });
  });

  if (seasonRecords.length === 0) {
    return {
      teamArchetypes: [],
      archetypeWinRates: [],
      archetypeDistribution: [],
    };
  }

  // Determine quartiles
  const offenseValues = seasonRecords
    .map((r) => r.ptsPerGame)
    .sort((a, b) => a - b);
  const defenseValues = seasonRecords
    .map((r) => r.ptsAllowedPerGame)
    .sort((a, b) => a - b);

  const offenseQ1 = offenseValues[Math.floor(offenseValues.length * 0.25)];
  const offenseQ3 = offenseValues[Math.floor(offenseValues.length * 0.75)];
  const defenseQ1 = defenseValues[Math.floor(defenseValues.length * 0.25)];
  const defenseQ3 = defenseValues[Math.floor(defenseValues.length * 0.75)];

  // Classify archetypes
  const teamArchetypes: TeamArchetypeRecord[] = seasonRecords.map((r) => {
    const topOffense = r.ptsPerGame >= offenseQ3;
    const bottomOffense = r.ptsPerGame <= offenseQ1;
    const topDefense = r.ptsAllowedPerGame <= defenseQ1;
    const bottomDefense = r.ptsAllowedPerGame >= defenseQ3;

    let archetype = "Average";
    if (topOffense && topDefense) {
      archetype = "Balanced Powerhouse";
    } else if (topOffense && bottomDefense) {
      archetype = "Offensive Juggernaut";
    } else if (bottomOffense && topDefense) {
      archetype = "Defensive Fortress";
    } else if (bottomOffense && bottomDefense) {
      archetype = "Rebuilding";
    }

    return {
      team: r.team,
      season: r.season,
      archetype,
      ptsPerGame: r.ptsPerGame,
      ptsAllowedPerGame: r.ptsAllowedPerGame,
    };
  });

  // Compute archetype win rates
  const archetypeWinMap = new Map<
    string,
    { totalWinPct: number; count: number }
  >();

  for (const r of seasonRecords) {
    const arch = teamArchetypes.find(
      (ta) => ta.team === r.team && ta.season === r.season
    );
    if (arch) {
      if (!archetypeWinMap.has(arch.archetype)) {
        archetypeWinMap.set(arch.archetype, { totalWinPct: 0, count: 0 });
      }
      const entry = archetypeWinMap.get(arch.archetype)!;
      entry.totalWinPct += r.winPct;
      entry.count++;
    }
  }

  const archetypeWinRates: ArchetypeWinRate[] = Array.from(
    archetypeWinMap.entries()
  )
    .map(([archetype, data]) => ({
      archetype,
      avgWinPct:
        data.count > 0
          ? Math.round((data.totalWinPct / data.count) * 10000) / 10000
          : 0,
      teams: data.count,
    }))
    .sort((a, b) => b.avgWinPct - a.avgWinPct);

  // Archetype distribution
  const archetypeCounts = new Map<string, number>();
  for (const ta of teamArchetypes) {
    archetypeCounts.set(
      ta.archetype,
      (archetypeCounts.get(ta.archetype) ?? 0) + 1
    );
  }

  const total = teamArchetypes.length;
  const archetypeDistribution: ArchetypeDistribution[] = Array.from(
    archetypeCounts.entries()
  )
    .map(([archetype, count]) => ({
      archetype,
      count,
      pct: total > 0 ? Math.round((count / total) * 10000) / 10000 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    teamArchetypes,
    archetypeWinRates,
    archetypeDistribution,
  };
}
