/**
 * Pure standings computation — no DB dependency.
 * Computes division/conference standings from game-like objects.
 */

export interface StandingsGame {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
  isPlayoff: boolean;
}

export interface TeamInfo {
  name: string;
  abbreviation: string;
  city: string;
  nickname: string;
  conference: string;
  division: string;
}

export interface TeamStanding {
  team: TeamInfo;
  wins: number;
  losses: number;
  ties: number;
  pct: string;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  homeRecord: string;
  awayRecord: string;
  divRecord: string;
  confRecord: string;
  streak: string;
}

export interface DivisionStandings {
  conference: string;
  division: string;
  teams: TeamStanding[];
}

export interface StandingsResult {
  divisions: DivisionStandings[];
  season: number | null;
}

/** Get teams in the same division */
function getDivisionTeams(team: TeamInfo, allTeams: TeamInfo[]): Set<string> {
  return new Set(
    allTeams
      .filter((t) => t.conference === team.conference && t.division === team.division && t.name !== team.name)
      .map((t) => t.name)
  );
}

/** Get teams in the same conference */
function getConferenceTeams(team: TeamInfo, allTeams: TeamInfo[]): Set<string> {
  return new Set(
    allTeams
      .filter((t) => t.conference === team.conference && t.name !== team.name)
      .map((t) => t.name)
  );
}

function formatSplitRecord(w: number, l: number, t: number): string {
  return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
}

function computeStreak(games: StandingsGame[], teamName: string): string {
  if (games.length === 0) return "--";

  let streakType: "W" | "L" | "T" | null = null;
  let count = 0;

  // Walk from most recent game backward
  for (let i = games.length - 1; i >= 0; i--) {
    const g = games[i];
    const won = g.winnerName === teamName;
    const tied = g.winnerName === null;

    let result: "W" | "L" | "T";
    if (won) result = "W";
    else if (tied) result = "T";
    else result = "L";

    if (streakType === null) {
      streakType = result;
      count = 1;
    } else if (result === streakType) {
      count++;
    } else {
      break;
    }
  }

  return streakType ? `${streakType}${count}` : "--";
}

function computeWinPct(wins: number, losses: number, ties: number): string {
  const total = wins + losses + ties;
  if (total === 0) return ".000";
  return (wins / total).toFixed(3);
}

export function computeStandings(
  games: StandingsGame[],
  teams: TeamInfo[],
  season: number | null = null
): StandingsResult {
  // Only count regular season games for standings
  const regGames = games.filter((g) => !g.isPlayoff);

  // Build per-team accumulators
  const teamMap = new Map<
    string,
    {
      info: TeamInfo;
      wins: number;
      losses: number;
      ties: number;
      pf: number;
      pa: number;
      homeW: number;
      homeL: number;
      homeT: number;
      awayW: number;
      awayL: number;
      awayT: number;
      divW: number;
      divL: number;
      divT: number;
      confW: number;
      confL: number;
      confT: number;
      games: StandingsGame[];
    }
  >();

  // Initialize all teams
  for (const t of teams) {
    teamMap.set(t.name, {
      info: t,
      wins: 0,
      losses: 0,
      ties: 0,
      pf: 0,
      pa: 0,
      homeW: 0,
      homeL: 0,
      homeT: 0,
      awayW: 0,
      awayL: 0,
      awayT: 0,
      divW: 0,
      divL: 0,
      divT: 0,
      confW: 0,
      confL: 0,
      confT: 0,
      games: [],
    });
  }

  // Pre-compute division and conference sets
  const divTeamSets = new Map<string, Set<string>>();
  const confTeamSets = new Map<string, Set<string>>();
  for (const t of teams) {
    divTeamSets.set(t.name, getDivisionTeams(t, teams));
    confTeamSets.set(t.name, getConferenceTeams(t, teams));
  }

  // Process games
  for (const g of regGames) {
    const homeTeam = teamMap.get(g.homeTeamName);
    const awayTeam = teamMap.get(g.awayTeamName);
    if (!homeTeam || !awayTeam) continue;

    homeTeam.games.push(g);
    awayTeam.games.push(g);

    const homeWon = g.winnerName === g.homeTeamName;
    const awayWon = g.winnerName === g.awayTeamName;
    const tied = g.winnerName === null;

    homeTeam.pf += g.homeScore;
    homeTeam.pa += g.awayScore;
    awayTeam.pf += g.awayScore;
    awayTeam.pa += g.homeScore;

    const isDivGame = divTeamSets.get(g.homeTeamName)?.has(g.awayTeamName) ?? false;
    const isConfGame = confTeamSets.get(g.homeTeamName)?.has(g.awayTeamName) ?? false;

    if (homeWon) {
      homeTeam.wins++;
      homeTeam.homeW++;
      awayTeam.losses++;
      awayTeam.awayL++;
      if (isDivGame) {
        homeTeam.divW++;
        awayTeam.divL++;
      }
      if (isConfGame) {
        homeTeam.confW++;
        awayTeam.confL++;
      }
    } else if (awayWon) {
      awayTeam.wins++;
      awayTeam.awayW++;
      homeTeam.losses++;
      homeTeam.homeL++;
      if (isDivGame) {
        awayTeam.divW++;
        homeTeam.divL++;
      }
      if (isConfGame) {
        awayTeam.confW++;
        homeTeam.confL++;
      }
    } else if (tied) {
      homeTeam.ties++;
      homeTeam.homeT++;
      awayTeam.ties++;
      awayTeam.awayT++;
      if (isDivGame) {
        homeTeam.divT++;
        awayTeam.divT++;
      }
      if (isConfGame) {
        homeTeam.confT++;
        awayTeam.confT++;
      }
    }
  }

  // Group by conference + division
  const divisionMap = new Map<string, TeamStanding[]>();
  const divOrder = ["EAST", "NORTH", "SOUTH", "WEST"];
  const confOrder = ["AFC", "NFC"];

  for (const [, data] of teamMap) {
    const key = `${data.info.conference}|${data.info.division}`;
    if (!divisionMap.has(key)) {
      divisionMap.set(key, []);
    }

    const standing: TeamStanding = {
      team: data.info,
      wins: data.wins,
      losses: data.losses,
      ties: data.ties,
      pct: computeWinPct(data.wins, data.losses, data.ties),
      pointsFor: data.pf,
      pointsAgainst: data.pa,
      pointDiff: data.pf - data.pa,
      homeRecord: formatSplitRecord(data.homeW, data.homeL, data.homeT),
      awayRecord: formatSplitRecord(data.awayW, data.awayL, data.awayT),
      divRecord: formatSplitRecord(data.divW, data.divL, data.divT),
      confRecord: formatSplitRecord(data.confW, data.confL, data.confT),
      streak: computeStreak(data.games, data.info.name),
    };

    divisionMap.get(key)!.push(standing);
  }

  // Sort teams within each division by win pct (desc), then point diff (desc)
  for (const [, standings] of divisionMap) {
    standings.sort((a, b) => {
      const pctDiff = parseFloat(b.pct) - parseFloat(a.pct);
      if (pctDiff !== 0) return pctDiff;
      return b.pointDiff - a.pointDiff;
    });
  }

  // Sort divisions: AFC East, AFC North, AFC South, AFC West, NFC East, ...
  const divisions: DivisionStandings[] = [];
  for (const conf of confOrder) {
    for (const div of divOrder) {
      const key = `${conf}|${div}`;
      const teams_in_div = divisionMap.get(key);
      if (teams_in_div && teams_in_div.length > 0) {
        divisions.push({
          conference: conf,
          division: div,
          teams: teams_in_div,
        });
      }
    }
  }

  return { divisions, season };
}
