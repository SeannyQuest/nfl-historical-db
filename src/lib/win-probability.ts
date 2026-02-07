/**
 * Pure win probability computation — no DB dependency.
 * Operates on arrays of game-like objects to compute win probability metrics.
 */

export interface WinProbGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeQ1: number;
  homeQ2: number;
  homeQ3: number;
  homeQ4: number;
  awayQ1: number;
  awayQ2: number;
  awayQ3: number;
  awayQ4: number;
}

export interface HalftimeLeadWinPct {
  leadRange: string;
  winPct: string;
  sampleSize: number;
}

export interface ComebackWinDeficit {
  deficit: string;
  wins: number;
  total: number;
  winPct: string;
}

export interface BiggestComeback {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  halfTimeDeficit: number;
  finalScore: string;
  winningTeam: string;
}

export interface TeamClutchRating {
  team: string;
  winsWhenTrailingAtHalf: number;
  totalTrailingAtHalf: number;
  clutchPct: string;
}

export interface WinProbabilityResult {
  halftimeLeadWinPct: HalftimeLeadWinPct[];
  q3LeadWinPct: HalftimeLeadWinPct[];
  comebackWinsByDeficit: ComebackWinDeficit[];
  biggestComebacks: BiggestComeback[];
  teamClutchRating: TeamClutchRating[];
}

function getLeadRange(lead: number): string {
  if (lead < 0) return "Trailing";
  if (lead === 0) return "Tied";
  if (lead <= 3) return "1-3";
  if (lead <= 7) return "4-7";
  if (lead <= 14) return "8-14";
  if (lead <= 21) return "15-21";
  return "22+";
}

export function computeWinProbability(games: WinProbGame[]): WinProbabilityResult {
  // Track halftime lead outcomes
  const halftimeLeadMap = new Map<
    string,
    { wins: number; total: number }
  >();

  // Track Q3 lead outcomes
  const q3LeadMap = new Map<
    string,
    { wins: number; total: number }
  >();

  // Track comeback wins by deficit
  const comebackDeficitMap = new Map<
    string,
    { wins: number; total: number }
  >();

  // Track biggest comebacks
  const comebacks: BiggestComeback[] = [];

  // Track team clutch performance
  const teamClutchMap = new Map<
    string,
    { wins: number; trailingGames: number }
  >();

  for (const g of games) {
    const homeWon = g.homeScore > g.awayScore;
    const awayWon = g.awayScore > g.homeScore;

    if (!homeWon && !awayWon) continue; // Skip ties

    // Halftime score
    const homeHalftime = g.homeQ1 + g.homeQ2;
    const awayHalftime = g.awayQ1 + g.awayQ2;
    const halftimeDiff = homeHalftime - awayHalftime;

    // Q3 score (through end of Q3)
    const homeQ3Score = g.homeQ1 + g.homeQ2 + g.homeQ3;
    const awayQ3Score = g.awayQ1 + g.awayQ2 + g.awayQ3;
    const q3Diff = homeQ3Score - awayQ3Score;

    // Halftime lead analysis
    if (homeHalftime > awayHalftime) {
      // Home team leading at halftime (from leader's perspective)
      const leadRange = getLeadRange(halftimeDiff);
      const entry = halftimeLeadMap.get(leadRange) || { wins: 0, total: 0 };
      entry.total++;
      if (homeWon) entry.wins++;
      halftimeLeadMap.set(leadRange, entry);

      // Track team clutch if away team is trailing
      if (!teamClutchMap.has(g.awayTeamName)) {
        teamClutchMap.set(g.awayTeamName, { wins: 0, trailingGames: 0 });
      }
      const awayStats = teamClutchMap.get(g.awayTeamName)!;
      awayStats.trailingGames++;
      if (awayWon) awayStats.wins++;
    } else if (awayHalftime > homeHalftime) {
      // Away team leading at halftime (from leader's perspective)
      const awayLead = awayHalftime - homeHalftime;
      const leadRange = getLeadRange(awayLead);
      const entry = halftimeLeadMap.get(leadRange) || { wins: 0, total: 0 };
      entry.total++;
      if (awayWon) entry.wins++;
      halftimeLeadMap.set(leadRange, entry);

      // Track team clutch if home team is trailing
      if (!teamClutchMap.has(g.homeTeamName)) {
        teamClutchMap.set(g.homeTeamName, { wins: 0, trailingGames: 0 });
      }
      const homeStats = teamClutchMap.get(g.homeTeamName)!;
      homeStats.trailingGames++;
      if (homeWon) homeStats.wins++;
    }

    // Q3 lead analysis
    if (homeQ3Score > awayQ3Score) {
      const leadRange = getLeadRange(q3Diff);
      const entry = q3LeadMap.get(leadRange) || { wins: 0, total: 0 };
      entry.total++;
      if (homeWon) entry.wins++;
      q3LeadMap.set(leadRange, entry);
    } else if (awayQ3Score > homeQ3Score) {
      const awayQ3Lead = awayQ3Score - homeQ3Score;
      const leadRange = getLeadRange(awayQ3Lead);
      const entry = q3LeadMap.get(leadRange) || { wins: 0, total: 0 };
      entry.total++;
      if (awayWon) entry.wins++;
      q3LeadMap.set(leadRange, entry);
    }

    // Comeback wins by deficit at halftime
    // Track all deficit situations (not just wins)
    if (halftimeDiff > 0) {
      // Away team was trailing at halftime
      const deficitRange = getLeadRange(halftimeDiff);
      const entry = comebackDeficitMap.get(deficitRange) || { wins: 0, total: 0 };
      entry.total++;
      if (awayWon) {
        entry.wins++;
        // Track as comeback win
        comebacks.push({
          season: g.season,
          homeTeamName: g.homeTeamName,
          awayTeamName: g.awayTeamName,
          halfTimeDeficit: halftimeDiff,
          finalScore: `${g.awayScore}-${g.homeScore}`,
          winningTeam: g.awayTeamName,
        });
      }
      comebackDeficitMap.set(deficitRange, entry);
    } else if (halftimeDiff < 0) {
      // Home team was trailing at halftime
      const deficitRange = getLeadRange(-halftimeDiff);
      const entry = comebackDeficitMap.get(deficitRange) || { wins: 0, total: 0 };
      entry.total++;
      if (homeWon) {
        entry.wins++;
        // Track as comeback win
        comebacks.push({
          season: g.season,
          homeTeamName: g.homeTeamName,
          awayTeamName: g.awayTeamName,
          halfTimeDeficit: -halftimeDiff,
          finalScore: `${g.homeScore}-${g.awayScore}`,
          winningTeam: g.homeTeamName,
        });
      }
      comebackDeficitMap.set(deficitRange, entry);
    }
  }

  // Convert halftime lead win pcts
  const halftimeLeadWinPct: HalftimeLeadWinPct[] = Array.from(
    halftimeLeadMap.entries()
  )
    .map(([leadRange, data]) => ({
      leadRange,
      winPct: data.total > 0 ? (data.wins / data.total).toFixed(3) : ".000",
      sampleSize: data.total,
    }))
    .sort((a, b) => {
      const order = ["Trailing", "Tied", "1-3", "4-7", "8-14", "15-21", "22+"];
      return order.indexOf(a.leadRange) - order.indexOf(b.leadRange);
    });

  // Convert Q3 lead win pcts
  const q3LeadWinPct: HalftimeLeadWinPct[] = Array.from(q3LeadMap.entries())
    .map(([leadRange, data]) => ({
      leadRange,
      winPct: data.total > 0 ? (data.wins / data.total).toFixed(3) : ".000",
      sampleSize: data.total,
    }))
    .sort((a, b) => {
      const order = ["Trailing", "Tied", "1-3", "4-7", "8-14", "15-21", "22+"];
      return order.indexOf(a.leadRange) - order.indexOf(b.leadRange);
    });

  // Convert comeback wins by deficit
  const comebackWinsByDeficit: ComebackWinDeficit[] = Array.from(
    comebackDeficitMap.entries()
  )
    .map(([deficit, data]) => ({
      deficit,
      wins: data.wins,
      total: data.total,
      winPct: data.total > 0 ? (data.wins / data.total).toFixed(3) : ".000",
    }))
    .sort((a, b) => {
      const order = ["1-3", "4-7", "8-14", "15-21", "22+"];
      return order.indexOf(a.deficit) - order.indexOf(b.deficit);
    });

  // Get top 10 biggest comebacks
  const biggestComebacks = comebacks
    .sort((a, b) => b.halfTimeDeficit - a.halfTimeDeficit)
    .slice(0, 10);

  // Convert team clutch ratings
  const teamClutchRating: TeamClutchRating[] = Array.from(
    teamClutchMap.entries()
  )
    .map(([team, stats]) => ({
      team,
      winsWhenTrailingAtHalf: stats.wins,
      totalTrailingAtHalf: stats.trailingGames,
      clutchPct:
        stats.trailingGames > 0
          ? (stats.wins / stats.trailingGames).toFixed(3)
          : ".000",
    }))
    .sort((a, b) =>
      parseFloat(b.clutchPct) - parseFloat(a.clutchPct)
    )
    .slice(0, 10);

  return {
    halftimeLeadWinPct,
    q3LeadWinPct,
    comebackWinsByDeficit,
    biggestComebacks,
    teamClutchRating,
  };
}
