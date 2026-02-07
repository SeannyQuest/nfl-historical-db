/**
 * Pure strength of victory computation — no DB dependency.
 * Analyzes the quality of wins against opponents' win rates.
 */

export interface SOVGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamSOVRecord {
  team: string;
  season: number;
  wins: number;
  losses: number;
  sov: number; // Strength of Victory: avg win% of teams beaten
  sos: number; // Strength of Schedule: avg win% of all opponents
  sovRank: number;
}

export interface SOVComparison {
  team: string;
  sov: number;
  sos: number;
  diff: number;
}

export interface StrengthOfVictoryResult {
  teamSOV: TeamSOVRecord[];
  bestSOV: TeamSOVRecord[];
  worstSOV: TeamSOVRecord[];
  sovVsSOS: SOVComparison[];
}

export function computeStrengthOfVictory(
  games: SOVGame[]
): StrengthOfVictoryResult {
  if (games.length === 0) {
    return {
      teamSOV: [],
      bestSOV: [],
      worstSOV: [],
      sovVsSOS: [],
    };
  }

  // Compute win percentage for each team per season
  interface TeamSeasonStats {
    wins: number;
    losses: number;
  }

  const teamSeasonWinPct = new Map<
    string,
    Map<number, { winPct: number; gamesPlayed: number }>
  >();

  // First pass: compute all team win percentages
  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;

    [
      { team: g.homeTeamName, won: homeWon },
      { team: g.awayTeamName, won: !homeWon },
    ].forEach(({ team, won }) => {
      if (!teamSeasonWinPct.has(team)) {
        teamSeasonWinPct.set(team, new Map());
      }
      const seasons = teamSeasonWinPct.get(team)!;
      if (!seasons.has(g.season)) {
        seasons.set(g.season, { winPct: 0, gamesPlayed: 0 });
      }
    });
  }

  // Count wins and losses per season
  const teamSeasonRecord = new Map<
    string,
    Map<number, TeamSeasonStats>
  >();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;

    [
      { team: g.homeTeamName, won: homeWon },
      { team: g.awayTeamName, won: !homeWon },
    ].forEach(({ team, won }) => {
      if (!teamSeasonRecord.has(team)) {
        teamSeasonRecord.set(team, new Map());
      }
      const seasons = teamSeasonRecord.get(team)!;
      if (!seasons.has(g.season)) {
        seasons.set(g.season, { wins: 0, losses: 0 });
      }
      const record = seasons.get(g.season)!;
      if (won) {
        record.wins++;
      } else {
        record.losses++;
      }
    });
  }

  // Calculate win percentages
  for (const [team, seasons] of teamSeasonRecord.entries()) {
    const sData = teamSeasonWinPct.get(team)!;
    for (const [season, record] of seasons.entries()) {
      const total = record.wins + record.losses;
      sData.set(season, {
        winPct: total > 0 ? record.wins / total : 0,
        gamesPlayed: total,
      });
    }
  }

  // Second pass: compute SOV and SOS
  interface SOVData {
    wins: number;
    losses: number;
    sovSum: number;
    sovCount: number;
    sosSum: number;
    sosCount: number;
  }

  const sovMap = new Map<string, Map<number, SOVData>>();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWinPct =
      teamSeasonWinPct.get(g.awayTeamName)?.get(g.season)?.winPct || 0;
    const homeWinPct =
      teamSeasonWinPct.get(g.homeTeamName)?.get(g.season)?.winPct || 0;

    // Home team
    if (!sovMap.has(g.homeTeamName)) {
      sovMap.set(g.homeTeamName, new Map());
    }
    const homeSeasons = sovMap.get(g.homeTeamName)!;
    if (!homeSeasons.has(g.season)) {
      homeSeasons.set(g.season, {
        wins: 0,
        losses: 0,
        sovSum: 0,
        sovCount: 0,
        sosSum: 0,
        sosCount: 0,
      });
    }
    const homeData = homeSeasons.get(g.season)!;

    if (homeWon) {
      homeData.wins++;
      homeData.sovSum += awayWinPct;
      homeData.sovCount++;
    } else {
      homeData.losses++;
    }
    homeData.sosSum += awayWinPct;
    homeData.sosCount++;

    // Away team
    if (!sovMap.has(g.awayTeamName)) {
      sovMap.set(g.awayTeamName, new Map());
    }
    const awaySeasons = sovMap.get(g.awayTeamName)!;
    if (!awaySeasons.has(g.season)) {
      awaySeasons.set(g.season, {
        wins: 0,
        losses: 0,
        sovSum: 0,
        sovCount: 0,
        sosSum: 0,
        sosCount: 0,
      });
    }
    const awayData = awaySeasons.get(g.season)!;

    if (!homeWon) {
      awayData.wins++;
      awayData.sovSum += homeWinPct;
      awayData.sovCount++;
    } else {
      awayData.losses++;
    }
    awayData.sosSum += homeWinPct;
    awayData.sosCount++;
  }

  // Build SOV records
  const teamSOV: TeamSOVRecord[] = [];

  for (const [team, seasons] of sovMap.entries()) {
    for (const [season, data] of seasons.entries()) {
      const sov =
        data.sovCount > 0
          ? Math.round((data.sovSum / data.sovCount) * 10000) / 10000
          : 0;
      const sos =
        data.sosCount > 0
          ? Math.round((data.sosSum / data.sosCount) * 10000) / 10000
          : 0;

      teamSOV.push({
        team,
        season,
        wins: data.wins,
        losses: data.losses,
        sov,
        sos,
        sovRank: 0, // Will set after sorting
      });
    }
  }

  // Sort by SOV and assign ranks
  teamSOV.sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;
    return b.sov - a.sov;
  });

  let currentSeason = -1;
  let rank = 1;
  for (let i = 0; i < teamSOV.length; i++) {
    if (teamSOV[i].season !== currentSeason) {
      currentSeason = teamSOV[i].season;
      rank = 1;
    }
    teamSOV[i].sovRank = rank++;
  }

  // Best SOV (top 10 overall)
  const bestSOV = [...teamSOV]
    .sort((a, b) => b.sov - a.sov)
    .slice(0, 10);

  // Worst SOV (bottom 10 overall)
  const worstSOV = [...teamSOV]
    .sort((a, b) => a.sov - b.sov)
    .slice(0, 10);

  // SOV vs SOS comparison (biggest gaps)
  const sovVsSOS: SOVComparison[] = [...teamSOV]
    .map((x) => ({
      team: `${x.team} (${x.season})`,
      sov: x.sov,
      sos: x.sos,
      diff: Math.round((x.sov - x.sos) * 10000) / 10000,
    }))
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 20);

  return {
    teamSOV,
    bestSOV,
    worstSOV,
    sovVsSOS,
  };
}
