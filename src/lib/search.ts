/**
 * Pure search utility functions — no DB dependency.
 * Parses free-text search into structured filters.
 */

export interface SearchFilters {
  teamNames: string[];
  scoreMin?: number;
  scoreMax?: number;
  seasonStart?: number;
  seasonEnd?: number;
  week?: string;
}

/**
 * Normalize team name by handling abbreviations, nicknames, and city names.
 * Returns the normalized name or null if not recognized.
 */
export function normalizeTeamName(input: string): string | null {
  if (!input) return null;

  const normalized = input.trim().toUpperCase();

  // Map of known team names, abbreviations, and nicknames
  const teamMap: Record<string, string> = {
    // Current teams
    "KC": "Kansas City Chiefs",
    "CHIEFS": "Kansas City Chiefs",
    "KANSAS CITY": "Kansas City Chiefs",
    "TB": "Tampa Bay Buccaneers",
    "BUCCANEERS": "Tampa Bay Buccaneers",
    "BUCS": "Tampa Bay Buccaneers",
    "TAMPA BAY": "Tampa Bay Buccaneers",
    "DAL": "Dallas Cowboys",
    "COWBOYS": "Dallas Cowboys",
    "DALLAS": "Dallas Cowboys",
    "PHI": "Philadelphia Eagles",
    "EAGLES": "Philadelphia Eagles",
    "PHILADELPHIA": "Philadelphia Eagles",
    "NYG": "New York Giants",
    "GIANTS": "New York Giants",
    "NEW YORK GIANTS": "New York Giants",
    "WAS": "Washington Commanders",
    "COMMANDERS": "Washington Commanders",
    "REDSKINS": "Washington Commanders",
    "WASHINGTON": "Washington Commanders",
    "SF": "San Francisco 49ers",
    "NINERS": "San Francisco 49ers",
    "49ERS": "San Francisco 49ers",
    "SAN FRANCISCO": "San Francisco 49ers",
    "LAR": "Los Angeles Rams",
    "RAMS": "Los Angeles Rams",
    "LOS ANGELES RAMS": "Los Angeles Rams",
    "SEA": "Seattle Seahawks",
    "SEAHAWKS": "Seattle Seahawks",
    "SEATTLE": "Seattle Seahawks",
    "ARI": "Arizona Cardinals",
    "CARDINALS": "Arizona Cardinals",
    "ARIZONA": "Arizona Cardinals",
    "NYJ": "New York Jets",
    "JETS": "New York Jets",
    "NEW YORK JETS": "New York Jets",
    "BUF": "Buffalo Bills",
    "BILLS": "Buffalo Bills",
    "BUFFALO": "Buffalo Bills",
    "MIA": "Miami Dolphins",
    "DOLPHINS": "Miami Dolphins",
    "MIAMI": "Miami Dolphins",
    "NE": "New England Patriots",
    "PATRIOTS": "New England Patriots",
    "NEW ENGLAND": "New England Patriots",
    "BAL": "Baltimore Ravens",
    "RAVENS": "Baltimore Ravens",
    "BALTIMORE": "Baltimore Ravens",
    "PIT": "Pittsburgh Steelers",
    "STEELERS": "Pittsburgh Steelers",
    "PITTSBURGH": "Pittsburgh Steelers",
    "CLE": "Cleveland Browns",
    "BROWNS": "Cleveland Browns",
    "CLEVELAND": "Cleveland Browns",
    "CIN": "Cincinnati Bengals",
    "BENGALS": "Cincinnati Bengals",
    "CINCINNATI": "Cincinnati Bengals",
    "IND": "Indianapolis Colts",
    "COLTS": "Indianapolis Colts",
    "INDIANAPOLIS": "Indianapolis Colts",
    "TEN": "Tennessee Titans",
    "TITANS": "Tennessee Titans",
    "TENNESSEE": "Tennessee Titans",
    "HOU": "Houston Texans",
    "TEXANS": "Houston Texans",
    "HOUSTON": "Houston Texans",
    "JAX": "Jacksonville Jaguars",
    "JAGUARS": "Jacksonville Jaguars",
    "JACKSONVILLE": "Jacksonville Jaguars",
    "GB": "Green Bay Packers",
    "PACKERS": "Green Bay Packers",
    "GREEN BAY": "Green Bay Packers",
    "DET": "Detroit Lions",
    "LIONS": "Detroit Lions",
    "DETROIT": "Detroit Lions",
    "CHI": "Chicago Bears",
    "BEARS": "Chicago Bears",
    "CHICAGO": "Chicago Bears",
    "MIN": "Minnesota Vikings",
    "VIKINGS": "Minnesota Vikings",
    "MINNESOTA": "Minnesota Vikings",
    "NO": "New Orleans Saints",
    "SAINTS": "New Orleans Saints",
    "NEW ORLEANS": "New Orleans Saints",
    "ATL": "Atlanta Falcons",
    "FALCONS": "Atlanta Falcons",
    "ATLANTA": "Atlanta Falcons",
    "CAR": "Carolina Panthers",
    "PANTHERS": "Carolina Panthers",
    "CAROLINA": "Carolina Panthers",
    "DEN": "Denver Broncos",
    "BRONCOS": "Denver Broncos",
    "DENVER": "Denver Broncos",
    "LAC": "Los Angeles Chargers",
    "CHARGERS": "Los Angeles Chargers",
    "LOS ANGELES CHARGERS": "Los Angeles Chargers",
    "OAK": "Oakland Raiders",
    "LV": "Las Vegas Raiders",
    "RAIDERS": "Las Vegas Raiders",
    "OAKLAND": "Oakland Raiders",
    "LAS VEGAS": "Las Vegas Raiders",
  };

  return teamMap[normalized] || null;
}

/**
 * Parse score range like "30+", "20-30", or "30" into {min, max}.
 * Returns null if not a valid score range.
 */
export function parseScoreRange(input: string): { min: number; max: number } | null {
  if (!input) return null;

  const trimmed = input.trim();

  // Handle "30+"
  if (trimmed.endsWith("+")) {
    const val = parseInt(trimmed.slice(0, -1), 10);
    if (!isNaN(val) && val >= 0) {
      return { min: val, max: 200 };
    }
  }

  // Handle "20-30" (must be digits-digits format)
  if (trimmed.includes("-") && /^\d+-\d+$/.test(trimmed)) {
    const parts = trimmed.split("-");
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10);
      const max = parseInt(parts[1], 10);
      if (min >= 0 && max >= min) {
        return { min, max };
      }
    }
  }

  // Handle plain number "30" (digits only)
  if (/^\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    if (val >= 0) {
      return { min: val, max: val };
    }
  }

  return null;
}

/**
 * Parse season range like "2020-2024", "since 2010", or "2020".
 * Returns {start, end} or null if invalid.
 */
export function parseSeasonRange(input: string): { start: number; end: number } | null {
  if (!input) return null;

  const trimmed = input.trim().toLowerCase();

  // Handle "since 2010"
  if (trimmed.startsWith("since ")) {
    const yearStr = trimmed.slice(6).trim();
    if (/^\d{4}$/.test(yearStr)) {
      const val = parseInt(yearStr, 10);
      if (val > 1900 && val < 2100) {
        return { start: val, end: 2025 };
      }
    }
  }

  // Handle "2020-2024"
  if (trimmed.includes("-") && /^\d{4}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split("-");
    if (parts.length === 2) {
      const start = parseInt(parts[0].trim(), 10);
      const end = parseInt(parts[1].trim(), 10);
      if (start > 1900 && end < 2100 && start <= end) {
        return { start, end };
      }
    }
  }

  // Handle plain year "2020" (4 digits only)
  if (/^\d{4}$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    if (val > 1900 && val < 2100) {
      return { start: val, end: val };
    }
  }

  return null;
}

/**
 * Parse free-text search into structured filters.
 * Examples:
 * - "Chiefs 2020" -> teams: ['Kansas City Chiefs'], season: 2020
 * - "30+ scoring" -> scoreMin: 30
 * - "since 2015 Giants" -> teams: ['New York Giants'], seasonStart: 2015
 */
export function buildSearchQuery(searchText: string): SearchFilters {
  const filters: SearchFilters = {
    teamNames: [],
  };

  if (!searchText) return filters;

  const tokens = searchText.trim().split(/\s+/);
  const used = new Set<number>();

  // First pass: identify team names
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;

    const token = tokens[i];
    const normalized = normalizeTeamName(token);

    if (normalized && !filters.teamNames.includes(normalized)) {
      filters.teamNames.push(normalized);
      used.add(i);
    }

    // Try two-word teams
    if (i + 1 < tokens.length && !used.has(i + 1)) {
      const twoWord = token + " " + tokens[i + 1];
      const normalized2 = normalizeTeamName(twoWord);
      if (normalized2 && !filters.teamNames.includes(normalized2)) {
        filters.teamNames.push(normalized2);
        used.add(i);
        used.add(i + 1);
      }
    }
  }

  // Second pass: identify scores and seasons
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;

    const token = tokens[i];

    // Try season range first (must come before score to handle ranges with dashes)
    const seasonRange = parseSeasonRange(token);
    if (seasonRange) {
      filters.seasonStart = seasonRange.start;
      filters.seasonEnd = seasonRange.end;
      used.add(i);
      continue;
    }

    // Try score range
    const scoreRange = parseScoreRange(token);
    if (scoreRange) {
      filters.scoreMin = scoreRange.min;
      filters.scoreMax = scoreRange.max;
      used.add(i);
      continue;
    }

    // Try "since" with next token
    if (token.toLowerCase() === "since" && i + 1 < tokens.length) {
      const seasonRange = parseSeasonRange("since " + tokens[i + 1]);
      if (seasonRange) {
        filters.seasonStart = seasonRange.start;
        filters.seasonEnd = seasonRange.end;
        used.add(i);
        used.add(i + 1);
        continue;
      }
    }

    // Try week like "week5"
    if (token.toLowerCase().startsWith("week")) {
      const week = token.slice(4);
      if (week && !isNaN(parseInt(week, 10))) {
        filters.week = week;
        used.add(i);
      }
    }
  }

  return filters;
}
