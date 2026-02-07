/**
 * Conference Strength Timeline — measure conference dominance over seasons.
 * Pure function, no DB dependency.
 */

export interface ConferenceGame {
  season: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  homeConference: string;
  awayConference: string;
  isPlayoff: boolean;
}

export interface ConferenceSeasonStats {
  wins: number;
  losses: number;
  avgMargin: string;
  playoffWins: number;
}

export interface SeasonConferenceStrength {
  season: number;
  afc: ConferenceSeasonStats;
  nfc: ConferenceSeasonStats;
}

export interface DominanceEra {
  conference: string;
  fromSeason: number;
  toSeason: number;
  avgMarginAdvantage: string;
}

export interface CrossConferenceRecord {
  season: number;
  afcWinsVsNfc: number;
  nfcWinsVsAfc: number;
}

export interface ConferenceTimelineResult {
  seasonConferenceStrength: SeasonConferenceStrength[];
  dominanceEras: DominanceEra[];
  crossConferenceRecord: CrossConferenceRecord[];
}

export function computeConferenceTimeline(games: ConferenceGame[]): ConferenceTimelineResult {
  if (games.length === 0) {
    return {
      seasonConferenceStrength: [],
      dominanceEras: [],
      crossConferenceRecord: [],
    };
  }

  // Track conference records by season
  const conferenceStatsBySeasonMap = new Map<
    number,
    {
      afc: { wins: number; losses: number; margins: number[]; playoffWins: number };
      nfc: { wins: number; losses: number; margins: number[]; playoffWins: number };
    }
  >();

  // Track cross-conference records
  const crossConfMap = new Map<number, { afcWinsVsNfc: number; nfcWinsVsAfc: number }>();

  for (const g of games) {
    // Only count inter-conference games
    if (g.homeConference === g.awayConference) continue;

    // Initialize season if needed
    if (!conferenceStatsBySeasonMap.has(g.season)) {
      conferenceStatsBySeasonMap.set(g.season, {
        afc: { wins: 0, losses: 0, margins: [], playoffWins: 0 },
        nfc: { wins: 0, losses: 0, margins: [], playoffWins: 0 },
      });
    }
    if (!crossConfMap.has(g.season)) {
      crossConfMap.set(g.season, { afcWinsVsNfc: 0, nfcWinsVsAfc: 0 });
    }

    const stats = conferenceStatsBySeasonMap.get(g.season)!;
    const crossConf = crossConfMap.get(g.season)!;
    const margin = Math.abs(g.homeScore - g.awayScore);

    // Determine winner
    if (g.homeScore > g.awayScore) {
      // Home team won
      if (g.homeConference === "AFC") {
        stats.afc.wins++;
        stats.nfc.losses++;
        crossConf.afcWinsVsNfc++;
        if (g.isPlayoff) stats.afc.playoffWins++;
        stats.afc.margins.push(margin);
      } else {
        stats.nfc.wins++;
        stats.afc.losses++;
        crossConf.nfcWinsVsAfc++;
        if (g.isPlayoff) stats.nfc.playoffWins++;
        stats.nfc.margins.push(margin);
      }
    } else if (g.awayScore > g.homeScore) {
      // Away team won
      if (g.awayConference === "AFC") {
        stats.afc.wins++;
        stats.nfc.losses++;
        crossConf.afcWinsVsNfc++;
        if (g.isPlayoff) stats.afc.playoffWins++;
        stats.afc.margins.push(margin);
      } else {
        stats.nfc.wins++;
        stats.afc.losses++;
        crossConf.nfcWinsVsAfc++;
        if (g.isPlayoff) stats.nfc.playoffWins++;
        stats.nfc.margins.push(margin);
      }
    }
  }

  // Build season conference strength
  const seasonConferenceStrength: SeasonConferenceStrength[] = [...conferenceStatsBySeasonMap]
    .map(([season, data]) => ({
      season,
      afc: {
        wins: data.afc.wins,
        losses: data.afc.losses,
        avgMargin:
          data.afc.margins.length > 0
            ? (
                data.afc.margins.reduce((a, b) => a + b, 0) /
                data.afc.margins.length
              ).toFixed(1)
            : "0.0",
        playoffWins: data.afc.playoffWins,
      },
      nfc: {
        wins: data.nfc.wins,
        losses: data.nfc.losses,
        avgMargin:
          data.nfc.margins.length > 0
            ? (
                data.nfc.margins.reduce((a, b) => a + b, 0) /
                data.nfc.margins.length
              ).toFixed(1)
            : "0.0",
        playoffWins: data.nfc.playoffWins,
      },
    }))
    .sort((a, b) => a.season - b.season);

  // Calculate dominance eras (consecutive seasons where one conf dominated)
  const dominanceEras: DominanceEra[] = [];
  let currentEraConf: string | null = null;
  let currentEraStart = -1;
  const marginsByEra: number[] = [];

  for (const season of seasonConferenceStrength) {
    const afcMargin = parseFloat(season.afc.avgMargin);
    const nfcMargin = parseFloat(season.nfc.avgMargin);
    const dominantConf = afcMargin > nfcMargin ? "AFC" : nfcMargin > afcMargin ? "NFC" : null;

    if (dominantConf === null) {
      if (currentEraConf !== null && marginsByEra.length > 0) {
        dominanceEras.push({
          conference: currentEraConf,
          fromSeason: currentEraStart,
          toSeason: season.season - 1,
          avgMarginAdvantage: (
            marginsByEra.reduce((a, b) => a + b, 0) / marginsByEra.length
          ).toFixed(2),
        });
      }
      currentEraConf = null;
      marginsByEra.length = 0;
    } else if (dominantConf === currentEraConf) {
      const avgDiff = Math.abs(afcMargin - nfcMargin);
      marginsByEra.push(avgDiff);
    } else {
      if (currentEraConf !== null && marginsByEra.length > 0) {
        dominanceEras.push({
          conference: currentEraConf,
          fromSeason: currentEraStart,
          toSeason: season.season - 1,
          avgMarginAdvantage: (
            marginsByEra.reduce((a, b) => a + b, 0) / marginsByEra.length
          ).toFixed(2),
        });
      }
      currentEraConf = dominantConf;
      currentEraStart = season.season;
      marginsByEra.length = 0;
      const avgDiff = Math.abs(afcMargin - nfcMargin);
      marginsByEra.push(avgDiff);
    }
  }

  // Finalize last era
  if (currentEraConf !== null && marginsByEra.length > 0) {
    const lastSeason =
      seasonConferenceStrength.length > 0
        ? seasonConferenceStrength[seasonConferenceStrength.length - 1].season
        : -1;
    dominanceEras.push({
      conference: currentEraConf,
      fromSeason: currentEraStart,
      toSeason: lastSeason,
      avgMarginAdvantage: (
        marginsByEra.reduce((a, b) => a + b, 0) / marginsByEra.length
      ).toFixed(2),
    });
  }

  // Build cross-conference record
  const crossConferenceRecord: CrossConferenceRecord[] = [...crossConfMap]
    .map(([season, data]) => ({
      season,
      afcWinsVsNfc: data.afcWinsVsNfc,
      nfcWinsVsAfc: data.nfcWinsVsAfc,
    }))
    .sort((a, b) => a.season - b.season);

  return {
    seasonConferenceStrength,
    dominanceEras,
    crossConferenceRecord,
  };
}
