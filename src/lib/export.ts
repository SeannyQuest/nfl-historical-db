/**
 * Pure data export functions — no DB dependency.
 * Formats game and team data for CSV and JSON export.
 */

export interface ExportGame {
  id: string;
  date: string;
  season: number;
  week: string;
  isPlayoff: boolean;
  homeTeamName: string;
  homeTeamAbbr: string;
  awayTeamName: string;
  awayTeamAbbr: string;
  homeScore: number;
  awayScore: number;
  spread: number | null;
  spreadResult: string | null;
  ouResult: string | null;
  overUnder: number | null;
  primetime: string | null;
}

export interface ExportTeamStats {
  teamName: string;
  teamAbbr: string;
  season: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  atsRecord: string;
}

/**
 * Converts array of games to CSV string format
 */
export function formatGamesCSV(games: ExportGame[]): string {
  const headers = [
    "Date",
    "Season",
    "Week",
    "Type",
    "Away Team",
    "Away Score",
    "Home Team",
    "Home Score",
    "Spread",
    "Spread Result",
    "Over/Under",
    "O/U Result",
    "Primetime",
  ];

  const rows = games.map((g) => [
    g.date.split("T")[0], // Date only
    g.season,
    g.week,
    g.isPlayoff ? "Playoff" : "Regular",
    `${g.awayTeamAbbr} ${g.awayTeamName}`,
    g.awayScore,
    `${g.homeTeamAbbr} ${g.homeTeamName}`,
    g.homeScore,
    g.spread ?? "",
    g.spreadResult ?? "",
    g.overUnder ?? "",
    g.ouResult ?? "",
    g.primetime ?? "",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

/**
 * Converts array of games to formatted JSON string
 */
export function formatGamesJSON(games: ExportGame[]): string {
  const formatted = games.map((g) => ({
    id: g.id,
    date: g.date.split("T")[0],
    season: g.season,
    week: g.week,
    type: g.isPlayoff ? "Playoff" : "Regular",
    away: {
      abbreviation: g.awayTeamAbbr,
      name: g.awayTeamName,
      score: g.awayScore,
    },
    home: {
      abbreviation: g.homeTeamAbbr,
      name: g.homeTeamName,
      score: g.homeScore,
    },
    betting: {
      spread: g.spread,
      spreadResult: g.spreadResult,
      overUnder: g.overUnder,
      ouResult: g.ouResult,
    },
    primetime: g.primetime,
  }));

  return JSON.stringify(formatted, null, 2);
}

/**
 * Converts array of team stats to CSV string format
 */
export function formatTeamStatsCSV(stats: ExportTeamStats[]): string {
  const headers = [
    "Team",
    "Season",
    "Wins",
    "Losses",
    "Ties",
    "Win %",
    "Points For",
    "Points Against",
    "Point Diff",
    "ATS Record",
  ];

  const rows = stats.map((s) => {
    const winPct = (s.wins + s.losses + s.ties > 0
      ? (s.wins / (s.wins + s.losses + s.ties)).toFixed(3)
      : ".000"
    ).replace(".", ".");
    const pointDiff = s.pointsFor - s.pointsAgainst;

    return [
      `${s.teamAbbr} ${s.teamName}`,
      s.season,
      s.wins,
      s.losses,
      s.ties,
      winPct,
      s.pointsFor,
      s.pointsAgainst,
      pointDiff,
      s.atsRecord,
    ];
  });

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

/**
 * Generates a descriptive filename with date based on export type and filters
 */
export function generateFilename(
  type: "games" | "team-stats",
  filters?: { season?: number; team?: string; format: "csv" | "json" }
): string {
  const date = new Date().toISOString().split("T")[0];
  let filename = `nfl-${type}-${date}`;

  if (filters?.season) {
    filename += `-s${filters.season}`;
  }
  if (filters?.team) {
    filename += `-${filters.team.toLowerCase().replace(/\s+/g, "-")}`;
  }

  filename += filters?.format === "json" ? ".json" : ".csv";

  return filename;
}
