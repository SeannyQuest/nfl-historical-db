import { describe, it, expect } from "vitest";

// Pure function tests for data pipeline logic - no external dependencies

// Data types
interface CFBTeamData {
  id: string;
  name: string;
  wins: number;
  losses: number;
  ppg: number;
  ppg_allowed: number;
}

interface CBBTeamData {
  id: string;
  name: string;
  wins: number;
  losses: number;
  fgp: number;
  fgp_allowed: number;
}

interface NFLSyncData {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  timestamp: number;
}

// CFB data preparation pipeline
function prepareCFBTeamData(rawData: Record<string, unknown>): CFBTeamData {
  return {
    id: String(rawData.id || ""),
    name: String(rawData.name || ""),
    wins: Number(rawData.wins || 0),
    losses: Number(rawData.losses || 0),
    ppg: Number(rawData.ppg || 0),
    ppg_allowed: Number(rawData.ppg_allowed || 0),
  };
}

function normalizeCFBData(teams: CFBTeamData[]): CFBTeamData[] {
  return teams
    .filter((t) => t.wins >= 0 && t.losses >= 0)
    .map((t) => ({
      ...t,
      ppg: Math.max(0, t.ppg),
      ppg_allowed: Math.max(0, t.ppg_allowed),
    }))
    .sort((a, b) => b.wins - a.wins);
}

// CBB data preparation pipeline
function prepareCBBTeamData(rawData: Record<string, unknown>): CBBTeamData {
  return {
    id: String(rawData.id || ""),
    name: String(rawData.name || ""),
    wins: Number(rawData.wins || 0),
    losses: Number(rawData.losses || 0),
    fgp: Number(rawData.fgp || 0),
    fgp_allowed: Number(rawData.fgp_allowed || 0),
  };
}

function normalizeCBBData(teams: CBBTeamData[]): CBBTeamData[] {
  return teams
    .filter((t) => t.wins >= 0 && t.losses >= 0)
    .map((t) => ({
      ...t,
      fgp: Math.min(100, Math.max(0, t.fgp)),
      fgp_allowed: Math.min(100, Math.max(0, t.fgp_allowed)),
    }))
    .sort((a, b) => {
      const aWinPct = a.wins / (a.wins + a.losses);
      const bWinPct = b.wins / (b.wins + b.losses);
      return bWinPct - aWinPct;
    });
}

// NFL sync data mapping
function mapNFLGameData(rawGame: Record<string, unknown>): NFLSyncData {
  return {
    gameId: String(rawGame.gameId || ""),
    homeTeam: String(rawGame.homeTeam || ""),
    awayTeam: String(rawGame.awayTeam || ""),
    homeScore: Number(rawGame.homeScore || 0),
    awayScore: Number(rawGame.awayScore || 0),
    timestamp: Number(rawGame.timestamp || 0),
  };
}

// Data health computation
interface DataHealth {
  cfbCoverage: number;
  cbbCoverage: number;
  nflCoverage: number;
  overallHealth: number;
}

function computeDataHealth(
  cfbTeams: number,
  cbbTeams: number,
  nflGames: number
): DataHealth {
  const cfbCoverage = Math.min(100, (cfbTeams / 130) * 100); // ~130 FBS teams
  const cbbCoverage = Math.min(100, (cbbTeams / 363) * 100); // ~363 D1 teams
  const nflCoverage = Math.min(100, (nflGames / 272) * 100); // ~272 games per season

  const overallHealth = (cfbCoverage + cbbCoverage + nflCoverage) / 3;

  return {
    cfbCoverage: Math.round(cfbCoverage * 100) / 100,
    cbbCoverage: Math.round(cbbCoverage * 100) / 100,
    nflCoverage: Math.round(nflCoverage * 100) / 100,
    overallHealth: Math.round(overallHealth * 100) / 100,
  };
}

// Cross-sport comparison with mixed data
interface SportComparison {
  sport: "CFB" | "CBB" | "NFL";
  topTeam: string;
  avgPointDiff: number;
}

function compareAcrossSports(
  cfbTeams: CFBTeamData[],
  cbbTeams: CBBTeamData[],
  nflGames: NFLSyncData[]
): SportComparison[] {
  const cfbComparison: SportComparison | null = cfbTeams.length > 0
    ? {
        sport: "CFB",
        topTeam: cfbTeams[0].name,
        avgPointDiff:
          cfbTeams.reduce(
            (sum, t) => sum + (t.ppg - t.ppg_allowed),
            0
          ) / cfbTeams.length,
      }
    : null;

  const cbbComparison: SportComparison | null = cbbTeams.length > 0
    ? {
        sport: "CBB",
        topTeam: cbbTeams[0].name,
        avgPointDiff: 0, // CBB doesn't have meaningful point diff in FG%
      }
    : null;

  const nflComparison: SportComparison | null = nflGames.length > 0
    ? {
        sport: "NFL",
        topTeam: nflGames[0].homeTeam,
        avgPointDiff:
          nflGames.reduce(
            (sum, g) => sum + (g.homeScore - g.awayScore),
            0
          ) / nflGames.length,
      }
    : null;

  return [cfbComparison, cbbComparison, nflComparison].filter(
    (c) => c !== null
  ) as SportComparison[];
}

describe("Data Pipeline Integration Tests", () => {
  describe("CFB data preparation", () => {
    it("prepares team data from raw input", () => {
      const rawData = {
        id: "123",
        name: "Alabama",
        wins: 13,
        losses: 0,
        ppg: 31.5,
        ppg_allowed: 14.2,
      };

      const prepared = prepareCFBTeamData(rawData);

      expect(prepared.id).toBe("123");
      expect(prepared.name).toBe("Alabama");
      expect(prepared.wins).toBe(13);
      expect(prepared.losses).toBe(0);
      expect(prepared.ppg).toBe(31.5);
      expect(prepared.ppg_allowed).toBe(14.2);
    });

    it("normalizes CFB data with valid filters and sorting", () => {
      const teams: CFBTeamData[] = [
        {
          id: "1",
          name: "Team A",
          wins: 10,
          losses: 2,
          ppg: 28,
          ppg_allowed: 15,
        },
        {
          id: "2",
          name: "Team B",
          wins: 12,
          losses: 1,
          ppg: 35,
          ppg_allowed: 12,
        },
        {
          id: "3",
          name: "Team C",
          wins: 5,
          losses: 7,
          ppg: 20,
          ppg_allowed: 28,
        },
      ];

      const normalized = normalizeCFBData(teams);

      expect(normalized[0].name).toBe("Team B"); // Most wins first
      expect(normalized[1].name).toBe("Team A");
      expect(normalized[2].name).toBe("Team C");
    });

    it("filters out invalid CFB data", () => {
      const teams: CFBTeamData[] = [
        { id: "1", name: "Valid", wins: 10, losses: 2, ppg: 28, ppg_allowed: 15 },
        {
          id: "2",
          name: "Invalid",
          wins: -1,
          losses: 2,
          ppg: 28,
          ppg_allowed: 15,
        },
        {
          id: "3",
          name: "Invalid2",
          wins: 5,
          losses: -1,
          ppg: 28,
          ppg_allowed: 15,
        },
      ];

      const normalized = normalizeCFBData(teams);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].name).toBe("Valid");
    });

    it("clamps negative stats to zero", () => {
      const teams: CFBTeamData[] = [
        {
          id: "1",
          name: "Team",
          wins: 10,
          losses: 2,
          ppg: -5,
          ppg_allowed: -10,
        },
      ];

      const normalized = normalizeCFBData(teams);

      expect(normalized[0].ppg).toBe(0);
      expect(normalized[0].ppg_allowed).toBe(0);
    });
  });

  describe("CBB data preparation", () => {
    it("prepares team data from raw input", () => {
      const rawData = {
        id: "456",
        name: "Duke",
        wins: 25,
        losses: 3,
        fgp: 48.5,
        fgp_allowed: 39.2,
      };

      const prepared = prepareCBBTeamData(rawData);

      expect(prepared.id).toBe("456");
      expect(prepared.name).toBe("Duke");
      expect(prepared.wins).toBe(25);
      expect(prepared.losses).toBe(3);
      expect(prepared.fgp).toBe(48.5);
      expect(prepared.fgp_allowed).toBe(39.2);
    });

    it("normalizes CBB data with win percentage sorting", () => {
      const teams: CBBTeamData[] = [
        {
          id: "1",
          name: "Team A",
          wins: 20,
          losses: 5,
          fgp: 45,
          fgp_allowed: 38,
        },
        {
          id: "2",
          name: "Team B",
          wins: 24,
          losses: 2,
          fgp: 48,
          fgp_allowed: 35,
        },
        {
          id: "3",
          name: "Team C",
          wins: 15,
          losses: 10,
          fgp: 42,
          fgp_allowed: 42,
        },
      ];

      const normalized = normalizeCBBData(teams);

      expect(normalized[0].name).toBe("Team B"); // Highest win %
      expect(normalized[1].name).toBe("Team A");
      expect(normalized[2].name).toBe("Team C");
    });

    it("clamps percentages to 0-100 range", () => {
      const teams: CBBTeamData[] = [
        {
          id: "1",
          name: "Team",
          wins: 10,
          losses: 5,
          fgp: 150,
          fgp_allowed: -10,
        },
      ];

      const normalized = normalizeCBBData(teams);

      expect(normalized[0].fgp).toBe(100);
      expect(normalized[0].fgp_allowed).toBe(0);
    });
  });

  describe("NFL sync data mapping", () => {
    it("maps raw game data to sync format", () => {
      const rawGame = {
        gameId: "game-001",
        homeTeam: "Chiefs",
        awayTeam: "Ravens",
        homeScore: 34,
        awayScore: 31,
        timestamp: 1234567890,
      };

      const mapped = mapNFLGameData(rawGame);

      expect(mapped.gameId).toBe("game-001");
      expect(mapped.homeTeam).toBe("Chiefs");
      expect(mapped.awayTeam).toBe("Ravens");
      expect(mapped.homeScore).toBe(34);
      expect(mapped.awayScore).toBe(31);
      expect(mapped.timestamp).toBe(1234567890);
    });

    it("handles missing fields with defaults", () => {
      const rawGame = {
        gameId: "game-002",
      };

      const mapped = mapNFLGameData(rawGame);

      expect(mapped.gameId).toBe("game-002");
      expect(mapped.homeTeam).toBe("");
      expect(mapped.awayTeam).toBe("");
      expect(mapped.homeScore).toBe(0);
      expect(mapped.awayScore).toBe(0);
      expect(mapped.timestamp).toBe(0);
    });
  });

  describe("Data health computation", () => {
    it("computes coverage percentages correctly", () => {
      const health = computeDataHealth(65, 180, 136); // 50% of each

      expect(health.cfbCoverage).toBeCloseTo(50, 1);
      expect(health.cbbCoverage).toBeCloseTo(49.6, 1);
      expect(health.nflCoverage).toBe(50);
    });

    it("computes overall health as average of coverage", () => {
      const health = computeDataHealth(130, 363, 272); // 100% of each

      expect(health.cfbCoverage).toBe(100);
      expect(health.cbbCoverage).toBe(100);
      expect(health.nflCoverage).toBe(100);
      expect(health.overallHealth).toBe(100);
    });

    it("handles zero data gracefully", () => {
      const health = computeDataHealth(0, 0, 0);

      expect(health.cfbCoverage).toBe(0);
      expect(health.cbbCoverage).toBe(0);
      expect(health.nflCoverage).toBe(0);
      expect(health.overallHealth).toBe(0);
    });

    it("caps coverage at 100 percent", () => {
      const health = computeDataHealth(200, 500, 300);

      expect(health.cfbCoverage).toBe(100);
      expect(health.cbbCoverage).toBe(100);
      expect(health.nflCoverage).toBe(100);
      expect(health.overallHealth).toBe(100);
    });
  });

  describe("Cross-sport comparison", () => {
    it("compares CFB teams", () => {
      const cfbTeams: CFBTeamData[] = [
        {
          id: "1",
          name: "Alabama",
          wins: 12,
          losses: 1,
          ppg: 35,
          ppg_allowed: 14,
        },
        {
          id: "2",
          name: "Georgia",
          wins: 11,
          losses: 2,
          ppg: 32,
          ppg_allowed: 16,
        },
      ];

      const comparisons = compareAcrossSports(cfbTeams, [], []);

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].sport).toBe("CFB");
      expect(comparisons[0].topTeam).toBe("Alabama");
      expect(comparisons[0].avgPointDiff).toBeCloseTo(18.5, 1);
    });

    it("compares CBB teams", () => {
      const cbbTeams: CBBTeamData[] = [
        { id: "1", name: "Duke", wins: 25, losses: 3, fgp: 48, fgp_allowed: 38 },
      ];

      const comparisons = compareAcrossSports([], cbbTeams, []);

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].sport).toBe("CBB");
      expect(comparisons[0].topTeam).toBe("Duke");
    });

    it("compares NFL games", () => {
      const nflGames: NFLSyncData[] = [
        {
          gameId: "1",
          homeTeam: "Chiefs",
          awayTeam: "Ravens",
          homeScore: 34,
          awayScore: 31,
          timestamp: 0,
        },
        {
          gameId: "2",
          homeTeam: "Bills",
          awayTeam: "Steelers",
          homeScore: 27,
          awayScore: 24,
          timestamp: 0,
        },
      ];

      const comparisons = compareAcrossSports([], [], nflGames);

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].sport).toBe("NFL");
      expect(comparisons[0].topTeam).toBe("Chiefs");
      expect(comparisons[0].avgPointDiff).toBe(3);
    });

    it("compares mixed sports data", () => {
      const cfbTeams: CFBTeamData[] = [
        {
          id: "1",
          name: "Alabama",
          wins: 12,
          losses: 1,
          ppg: 35,
          ppg_allowed: 14,
        },
      ];
      const cbbTeams: CBBTeamData[] = [
        { id: "1", name: "Duke", wins: 25, losses: 3, fgp: 48, fgp_allowed: 38 },
      ];
      const nflGames: NFLSyncData[] = [
        {
          gameId: "1",
          homeTeam: "Chiefs",
          awayTeam: "Ravens",
          homeScore: 34,
          awayScore: 31,
          timestamp: 0,
        },
      ];

      const comparisons = compareAcrossSports(cfbTeams, cbbTeams, nflGames);

      expect(comparisons).toHaveLength(3);
      expect(comparisons[0].sport).toBe("CFB");
      expect(comparisons[1].sport).toBe("CBB");
      expect(comparisons[2].sport).toBe("NFL");
    });

    it("handles empty datasets gracefully", () => {
      const comparisons = compareAcrossSports([], [], []);

      expect(comparisons).toHaveLength(0);
    });
  });
});
