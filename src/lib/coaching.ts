/**
 * Pure coaching analysis — no DB dependency.
 * Approximates coaching effectiveness through team-level stats.
 */

export interface CoachingGame {
  season: number;
  week: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

export interface TeamCoachingStats {
  team: string;
  seasons: number;
  avgWinPct: string;
  consistencyScore: string;
  biggestImprovement: string;
  biggestDecline: string;
  turnroundTeams: number;
}

export interface CoachingStats {
  totalTeams: number;
  mostImprovedTeams: Array<{
    team: string;
    previousSeason: number;
    previousWinPct: string;
    currentSeason: number;
    currentWinPct: string;
    improvement: string;
  }>;
  mostDeclinedTeams: Array<{
    team: string;
    previousSeason: number;
    previousWinPct: string;
    currentSeason: number;
    currentWinPct: string;
    decline: string;
  }>;
  consistentTeams: TeamCoachingStats[];
}

export interface CoachingResult {
  stats: CoachingStats;
}

export function computeCoachingStats(games: CoachingGame[]): CoachingResult {
  if (games.length === 0) {
    return {
      stats: {
        totalTeams: 0,
        mostImprovedTeams: [],
        mostDeclinedTeams: [],
        consistentTeams: [],
      },
    };
  }

  // Build season-by-season records
  const teamSeasonRecords = new Map<
    string,
    Map<
      number,
      { wins: number; losses: number; ties: number; pointsFor: number; pointsAgainst: number }
    >
  >();

  for (const game of games) {
    const homeWon = game.homeScore > game.awayScore;
    const awayWon = game.awayScore > game.homeScore;
    const isTie = game.homeScore === game.awayScore;

    // Home team
    if (!teamSeasonRecords.has(game.homeTeamName)) {
      teamSeasonRecords.set(game.homeTeamName, new Map());
    }
    const homeSeasonMap = teamSeasonRecords.get(game.homeTeamName)!;
    if (!homeSeasonMap.has(game.season)) {
      homeSeasonMap.set(game.season, { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 });
    }
    const homeRecord = homeSeasonMap.get(game.season)!;
    homeRecord.pointsFor += game.homeScore;
    homeRecord.pointsAgainst += game.awayScore;
    if (homeWon) homeRecord.wins++;
    else if (awayWon) homeRecord.losses++;
    else if (isTie) homeRecord.ties++;

    // Away team
    if (!teamSeasonRecords.has(game.awayTeamName)) {
      teamSeasonRecords.set(game.awayTeamName, new Map());
    }
    const awaySeasonMap = teamSeasonRecords.get(game.awayTeamName)!;
    if (!awaySeasonMap.has(game.season)) {
      awaySeasonMap.set(game.season, { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 });
    }
    const awayRecord = awaySeasonMap.get(game.season)!;
    awayRecord.pointsFor += game.awayScore;
    awayRecord.pointsAgainst += game.homeScore;
    if (awayWon) awayRecord.wins++;
    else if (homeWon) awayRecord.losses++;
    else if (isTie) awayRecord.ties++;
  }

  // Compute year-over-year changes
  const improvements: Array<{
    team: string;
    prevSeason: number;
    prevWinPct: number;
    currSeason: number;
    currWinPct: number;
    improvement: number;
  }> = [];

  const declines: Array<{
    team: string;
    prevSeason: number;
    prevWinPct: number;
    currSeason: number;
    currWinPct: number;
    decline: number;
  }> = [];

  for (const [team, seasonMap] of teamSeasonRecords) {
    const seasons = Array.from(seasonMap.keys()).sort((a, b) => a - b);

    for (let i = 1; i < seasons.length; i++) {
      const prevSeason = seasons[i - 1];
      const currSeason = seasons[i];

      const prevRecord = seasonMap.get(prevSeason)!;
      const currRecord = seasonMap.get(currSeason)!;

      const prevGames = prevRecord.wins + prevRecord.losses + prevRecord.ties;
      const currGames = currRecord.wins + currRecord.losses + currRecord.ties;

      if (prevGames > 0 && currGames > 0) {
        const prevWinPct = prevRecord.wins / prevGames;
        const currWinPct = currRecord.wins / currGames;
        const change = currWinPct - prevWinPct;

        if (change > 0) {
          improvements.push({
            team,
            prevSeason,
            prevWinPct,
            currSeason,
            currWinPct,
            improvement: change,
          });
        } else if (change < 0) {
          declines.push({
            team,
            prevSeason,
            prevWinPct,
            currSeason,
            currWinPct,
            decline: Math.abs(change),
          });
        }
      }
    }
  }

  // Sort and limit
  const mostImprovedTeams = improvements
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10)
    .map((item) => ({
      team: item.team,
      previousSeason: item.prevSeason,
      previousWinPct: item.prevWinPct.toFixed(3),
      currentSeason: item.currSeason,
      currentWinPct: item.currWinPct.toFixed(3),
      improvement: item.improvement.toFixed(3),
    }));

  const mostDeclinedTeams = declines
    .sort((a, b) => b.decline - a.decline)
    .slice(0, 10)
    .map((item) => ({
      team: item.team,
      previousSeason: item.prevSeason,
      previousWinPct: item.prevWinPct.toFixed(3),
      currentSeason: item.currSeason,
      currentWinPct: item.currWinPct.toFixed(3),
      decline: item.decline.toFixed(3),
    }));

  // Consistency analysis
  const consistentTeams: TeamCoachingStats[] = [];
  for (const [team, seasonMap] of teamSeasonRecords) {
    const seasons = Array.from(seasonMap.keys()).sort((a, b) => a - b);

    if (seasons.length > 1) {
      const winPcts: number[] = [];
      for (const season of seasons) {
        const record = seasonMap.get(season)!;
        const games = record.wins + record.losses + record.ties;
        if (games > 0) {
          winPcts.push(record.wins / games);
        }
      }

      if (winPcts.length > 1) {
        const avgWinPct = winPcts.reduce((a, b) => a + b, 0) / winPcts.length;
        const variance = winPcts.reduce((sum, pct) => sum + Math.pow(pct - avgWinPct, 2), 0) / winPcts.length;
        const stdDev = Math.sqrt(variance);

        // Consistency score: lower std dev = higher consistency (inverted)
        const consistencyScore = Math.max(0, 1 - stdDev);

        let biggestImprovement = ".000";
        let biggestDecline = ".000";

        for (let i = 1; i < winPcts.length; i++) {
          const change = winPcts[i] - winPcts[i - 1];
          if (change > 0) {
            biggestImprovement = Math.max(parseFloat(biggestImprovement), change).toFixed(3);
          } else {
            biggestDecline = Math.max(parseFloat(biggestDecline), Math.abs(change)).toFixed(3);
          }
        }

        consistentTeams.push({
          team,
          seasons: seasons.length,
          avgWinPct: avgWinPct.toFixed(3),
          consistencyScore: consistencyScore.toFixed(3),
          biggestImprovement,
          biggestDecline,
          turnroundTeams: improvements.filter((imp) => imp.team === team).length,
        });
      }
    }
  }

  consistentTeams.sort((a, b) => parseFloat(b.consistencyScore) - parseFloat(a.consistencyScore));

  return {
    stats: {
      totalTeams: teamSeasonRecords.size,
      mostImprovedTeams,
      mostDeclinedTeams,
      consistentTeams: consistentTeams.slice(0, 15),
    },
  };
}
