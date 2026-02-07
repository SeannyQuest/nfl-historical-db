/**
 * Pure playoff stats computation — no DB dependency.
 * Computes team postseason records, round-by-round breakdowns,
 * Super Bowl history, and dynasty analysis.
 */

// ─── Types ──────────────────────────────────────────────

export interface PlayoffGame {
  id: string;
  date: string;
  season: number;
  week: string; // "WildCard", "Division", "ConfChamp", "SuperBowl"
  homeTeamName: string;
  homeTeamAbbr: string;
  awayTeamName: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  winnerName: string | null;
}

export interface TeamPlayoffRecord {
  teamName: string;
  teamAbbr: string;
  totalWins: number;
  totalLosses: number;
  totalGames: number;
  winPct: string;
  superBowlWins: number;
  superBowlLosses: number;
  superBowlAppearances: number;
  confChampWins: number;
  confChampLosses: number;
  divRoundWins: number;
  divRoundLosses: number;
  wildCardWins: number;
  wildCardLosses: number;
  lastPlayoffSeason: number | null;
  playoffSeasons: number;
  superBowlWinSeasons: number[];
}

export interface SuperBowlEntry {
  season: number;
  winnerName: string;
  winnerAbbr: string;
  loserName: string;
  loserAbbr: string;
  winnerScore: number;
  loserScore: number;
  gameId: string;
}

export interface PlayoffSeasonSummary {
  season: number;
  totalGames: number;
  avgTotal: number;
  highestTotal: number;
  lowestTotal: number;
  homeWins: number;
  awayWins: number;
  superBowlWinner: string | null;
  superBowlWinnerAbbr: string | null;
}

export interface PlayoffStatsResult {
  teamRecords: TeamPlayoffRecord[];
  superBowlHistory: SuperBowlEntry[];
  seasonSummaries: PlayoffSeasonSummary[];
  totals: {
    totalGames: number;
    totalSeasons: number;
    avgTotal: number;
    homeWinPct: string;
    highestScoringGame: { label: string; value: number; gameId: string } | null;
  };
}

// ─── Round helpers ──────────────────────────────────────

const PLAYOFF_ROUNDS = ["WildCard", "Division", "ConfChamp", "SuperBowl"] as const;

function isPlayoffRound(week: string): boolean {
  return (PLAYOFF_ROUNDS as readonly string[]).includes(week);
}

export function roundLabel(round: string): string {
  if (round === "WildCard") return "Wild Card";
  if (round === "Division") return "Divisional";
  if (round === "ConfChamp") return "Conf. Championship";
  if (round === "SuperBowl") return "Super Bowl";
  return round;
}

// ─── Main computation ───────────────────────────────────

export function computePlayoffStats(games: PlayoffGame[]): PlayoffStatsResult {
  // Filter to playoff games only
  const playoffGames = games.filter((g) => isPlayoffRound(g.week));

  if (playoffGames.length === 0) {
    return {
      teamRecords: [],
      superBowlHistory: [],
      seasonSummaries: [],
      totals: {
        totalGames: 0,
        totalSeasons: 0,
        avgTotal: 0,
        homeWinPct: "0.000",
        highestScoringGame: null,
      },
    };
  }

  // ─── Team records ───────────────────────────────────
  const teamMap = new Map<
    string,
    {
      abbr: string;
      wins: number;
      losses: number;
      sbWins: number;
      sbLosses: number;
      ccWins: number;
      ccLosses: number;
      divWins: number;
      divLosses: number;
      wcWins: number;
      wcLosses: number;
      seasons: Set<number>;
      lastSeason: number;
      sbWinSeasons: number[];
    }
  >();

  function ensureTeam(name: string, abbr: string) {
    if (!teamMap.has(name)) {
      teamMap.set(name, {
        abbr,
        wins: 0,
        losses: 0,
        sbWins: 0,
        sbLosses: 0,
        ccWins: 0,
        ccLosses: 0,
        divWins: 0,
        divLosses: 0,
        wcWins: 0,
        wcLosses: 0,
        seasons: new Set(),
        lastSeason: 0,
        sbWinSeasons: [],
      });
    }
  }

  // ─── Super Bowl history ─────────────────────────────
  const superBowlHistory: SuperBowlEntry[] = [];

  // ─── Season summaries ───────────────────────────────
  const seasonMap = new Map<
    number,
    {
      games: number;
      totalPts: number;
      highestTotal: number;
      lowestTotal: number;
      homeWins: number;
      awayWins: number;
      sbWinner: string | null;
      sbWinnerAbbr: string | null;
    }
  >();

  // ─── Overall totals ────────────────────────────────
  let totalPoints = 0;
  let homeWins = 0;
  let awayWins = 0;
  let highestGame: { label: string; value: number; gameId: string } | null =
    null;

  // ─── Process games ─────────────────────────────────
  for (const game of playoffGames) {
    const total = game.homeScore + game.awayScore;
    totalPoints += total;

    ensureTeam(game.homeTeamName, game.homeTeamAbbr);
    ensureTeam(game.awayTeamName, game.awayTeamAbbr);

    const homeTeam = teamMap.get(game.homeTeamName)!;
    const awayTeam = teamMap.get(game.awayTeamName)!;

    homeTeam.seasons.add(game.season);
    awayTeam.seasons.add(game.season);
    homeTeam.lastSeason = Math.max(homeTeam.lastSeason, game.season);
    awayTeam.lastSeason = Math.max(awayTeam.lastSeason, game.season);

    const homeWon = game.winnerName === game.homeTeamName;
    const awayWon = game.winnerName === game.awayTeamName;

    if (homeWon) {
      homeTeam.wins++;
      awayTeam.losses++;
      homeWins++;
    } else if (awayWon) {
      awayTeam.wins++;
      homeTeam.losses++;
      awayWins++;
    }

    // Round-specific records
    if (game.week === "SuperBowl") {
      if (homeWon) {
        homeTeam.sbWins++;
        awayTeam.sbLosses++;
        homeTeam.sbWinSeasons.push(game.season);
      } else if (awayWon) {
        awayTeam.sbWins++;
        homeTeam.sbLosses++;
        awayTeam.sbWinSeasons.push(game.season);
      }

      if (game.winnerName) {
        const isHomeWinner = game.winnerName === game.homeTeamName;
        superBowlHistory.push({
          season: game.season,
          winnerName: isHomeWinner ? game.homeTeamName : game.awayTeamName,
          winnerAbbr: isHomeWinner ? game.homeTeamAbbr : game.awayTeamAbbr,
          loserName: isHomeWinner ? game.awayTeamName : game.homeTeamName,
          loserAbbr: isHomeWinner ? game.awayTeamAbbr : game.homeTeamAbbr,
          winnerScore: isHomeWinner ? game.homeScore : game.awayScore,
          loserScore: isHomeWinner ? game.awayScore : game.homeScore,
          gameId: game.id,
        });
      }
    } else if (game.week === "ConfChamp") {
      if (homeWon) {
        homeTeam.ccWins++;
        awayTeam.ccLosses++;
      } else if (awayWon) {
        awayTeam.ccWins++;
        homeTeam.ccLosses++;
      }
    } else if (game.week === "Division") {
      if (homeWon) {
        homeTeam.divWins++;
        awayTeam.divLosses++;
      } else if (awayWon) {
        awayTeam.divWins++;
        homeTeam.divLosses++;
      }
    } else if (game.week === "WildCard") {
      if (homeWon) {
        homeTeam.wcWins++;
        awayTeam.wcLosses++;
      } else if (awayWon) {
        awayTeam.wcWins++;
        homeTeam.wcLosses++;
      }
    }

    // Highest scoring game
    if (!highestGame || total > highestGame.value) {
      highestGame = {
        label: `${game.awayTeamAbbr} @ ${game.homeTeamAbbr} (${game.awayScore}-${game.homeScore})`,
        value: total,
        gameId: game.id,
      };
    }

    // Season summaries
    if (!seasonMap.has(game.season)) {
      seasonMap.set(game.season, {
        games: 0,
        totalPts: 0,
        highestTotal: 0,
        lowestTotal: Infinity,
        homeWins: 0,
        awayWins: 0,
        sbWinner: null,
        sbWinnerAbbr: null,
      });
    }
    const ss = seasonMap.get(game.season)!;
    ss.games++;
    ss.totalPts += total;
    if (total > ss.highestTotal) ss.highestTotal = total;
    if (total < ss.lowestTotal) ss.lowestTotal = total;
    if (homeWon) ss.homeWins++;
    if (awayWon) ss.awayWins++;

    if (game.week === "SuperBowl" && game.winnerName) {
      const isHomeWinner = game.winnerName === game.homeTeamName;
      ss.sbWinner = game.winnerName;
      ss.sbWinnerAbbr = isHomeWinner
        ? game.homeTeamAbbr
        : game.awayTeamAbbr;
    }
  }

  // ─── Build team records array ───────────────────────
  const teamRecords: TeamPlayoffRecord[] = Array.from(teamMap.entries())
    .map(([name, t]) => {
      const totalGames = t.wins + t.losses;
      return {
        teamName: name,
        teamAbbr: t.abbr,
        totalWins: t.wins,
        totalLosses: t.losses,
        totalGames,
        winPct: totalGames > 0 ? (t.wins / totalGames).toFixed(3) : "0.000",
        superBowlWins: t.sbWins,
        superBowlLosses: t.sbLosses,
        superBowlAppearances: t.sbWins + t.sbLosses,
        confChampWins: t.ccWins,
        confChampLosses: t.ccLosses,
        divRoundWins: t.divWins,
        divRoundLosses: t.divLosses,
        wildCardWins: t.wcWins,
        wildCardLosses: t.wcLosses,
        lastPlayoffSeason: t.lastSeason || null,
        playoffSeasons: t.seasons.size,
        superBowlWinSeasons: t.sbWinSeasons.sort((a, b) => a - b),
      };
    })
    .sort((a, b) => {
      // Sort by SB wins desc, then total wins desc, then win pct desc
      if (b.superBowlWins !== a.superBowlWins)
        return b.superBowlWins - a.superBowlWins;
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return parseFloat(b.winPct) - parseFloat(a.winPct);
    });

  // ─── Build Super Bowl history (desc) ────────────────
  superBowlHistory.sort((a, b) => b.season - a.season);

  // ─── Build season summaries (desc) ──────────────────
  const seasonSummaries: PlayoffSeasonSummary[] = Array.from(
    seasonMap.entries()
  )
    .map(([season, s]) => ({
      season,
      totalGames: s.games,
      avgTotal: s.games > 0 ? Math.round((s.totalPts / s.games) * 10) / 10 : 0,
      highestTotal: s.highestTotal,
      lowestTotal: s.lowestTotal === Infinity ? 0 : s.lowestTotal,
      homeWins: s.homeWins,
      awayWins: s.awayWins,
      superBowlWinner: s.sbWinner,
      superBowlWinnerAbbr: s.sbWinnerAbbr,
    }))
    .sort((a, b) => b.season - a.season);

  // ─── Overall totals ────────────────────────────────
  const decisions = homeWins + awayWins;
  const totals = {
    totalGames: playoffGames.length,
    totalSeasons: seasonMap.size,
    avgTotal:
      playoffGames.length > 0
        ? Math.round((totalPoints / playoffGames.length) * 10) / 10
        : 0,
    homeWinPct:
      decisions > 0 ? (homeWins / decisions).toFixed(3) : "0.000",
    highestScoringGame: highestGame,
  };

  return { teamRecords, superBowlHistory, seasonSummaries, totals };
}
