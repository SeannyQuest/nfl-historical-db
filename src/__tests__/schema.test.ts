import { describe, it, expect } from "vitest";
import { ALL_TEAMS, CURRENT_TEAMS, HISTORICAL_TEAMS } from "../../prisma/team-data";
import type { TeamSeed } from "../../prisma/team-data";

describe("Team seed data", () => {
  it("has exactly 32 active (current) teams", () => {
    expect(CURRENT_TEAMS).toHaveLength(32);
    expect(CURRENT_TEAMS.every((t) => t.isActive)).toBe(true);
  });

  it("has historical teams all marked inactive", () => {
    expect(HISTORICAL_TEAMS.length).toBeGreaterThan(0);
    expect(HISTORICAL_TEAMS.every((t) => !t.isActive)).toBe(true);
  });

  it("has no duplicate team names", () => {
    const names = ALL_TEAMS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has no duplicate abbreviations", () => {
    const abbrs = ALL_TEAMS.map((t) => t.abbreviation);
    expect(new Set(abbrs).size).toBe(abbrs.length);
  });

  it("has all required fields for every team", () => {
    const required: (keyof TeamSeed)[] = [
      "name",
      "abbreviation",
      "city",
      "nickname",
      "conference",
      "division",
      "franchiseKey",
    ];
    for (const team of ALL_TEAMS) {
      for (const field of required) {
        expect(team[field], `${team.name} missing ${field}`).toBeTruthy();
      }
    }
  });

  it("uses only valid conference values", () => {
    const valid = new Set(["AFC", "NFC"]);
    for (const team of ALL_TEAMS) {
      expect(valid.has(team.conference), `${team.name} has invalid conference: ${team.conference}`).toBe(true);
    }
  });

  it("uses only valid division values", () => {
    const valid = new Set(["EAST", "WEST", "NORTH", "SOUTH"]);
    for (const team of ALL_TEAMS) {
      expect(valid.has(team.division), `${team.name} has invalid division: ${team.division}`).toBe(true);
    }
  });

  it("has 8 divisions with 4 active teams each", () => {
    const divisionCounts: Record<string, number> = {};
    for (const team of CURRENT_TEAMS) {
      const key = `${team.conference}_${team.division}`;
      divisionCounts[key] = (divisionCounts[key] || 0) + 1;
    }
    expect(Object.keys(divisionCounts)).toHaveLength(8);
    for (const [div, count] of Object.entries(divisionCounts)) {
      expect(count, `${div} should have 4 teams`).toBe(4);
    }
  });

  it("maps all franchise keys from FRANCHISE_MAP in generate_data.py", () => {
    // These are the franchise keys used in the Python scraper's FRANCHISE_MAP
    const expectedFranchiseKeys = [
      "Colts",
      "Raiders",
      "Chargers",
      "Rams",
      "Titans",
      "Cardinals",
      "Washington",
      "Patriots",
      "Texans",
    ];
    const seedFranchiseKeys = new Set(ALL_TEAMS.map((t) => t.franchiseKey));
    for (const key of expectedFranchiseKeys) {
      expect(seedFranchiseKeys.has(key), `Missing franchise key: ${key}`).toBe(true);
    }
  });

  it("maps all historical team names from FRANCHISE_MAP", () => {
    // All historical names that appear in the Python FRANCHISE_MAP
    const historicalNames = [
      "Baltimore Colts",
      "Oakland Raiders",
      "Los Angeles Raiders",
      "San Diego Chargers",
      "St. Louis Rams",
      "Cleveland Rams",
      "Tennessee Oilers",
      "Houston Oilers",
      "Phoenix Cardinals",
      "St. Louis Cardinals",
      "Chicago Cardinals",
      "Washington Football Team",
      "Washington Redskins",
      "Boston Patriots",
    ];
    const seedNames = new Set(ALL_TEAMS.map((t) => t.name));
    for (const name of historicalNames) {
      expect(seedNames.has(name), `Missing historical team: ${name}`).toBe(true);
    }
  });

  it("groups historical names under correct franchise key", () => {
    const franchiseGroups: Record<string, string[]> = {};
    for (const team of ALL_TEAMS) {
      if (!franchiseGroups[team.franchiseKey]) {
        franchiseGroups[team.franchiseKey] = [];
      }
      franchiseGroups[team.franchiseKey].push(team.name);
    }

    // Spot-check key franchise groupings
    expect(franchiseGroups["Raiders"]).toEqual(
      expect.arrayContaining(["Las Vegas Raiders", "Oakland Raiders", "Los Angeles Raiders"])
    );
    expect(franchiseGroups["Colts"]).toEqual(
      expect.arrayContaining(["Indianapolis Colts", "Baltimore Colts"])
    );
    expect(franchiseGroups["Washington"]).toEqual(
      expect.arrayContaining(["Washington Commanders", "Washington Football Team", "Washington Redskins"])
    );
    expect(franchiseGroups["Titans"]).toEqual(
      expect.arrayContaining(["Tennessee Titans", "Tennessee Oilers", "Houston Oilers"])
    );
  });
});
