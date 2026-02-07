import { describe, it, expect } from "vitest";
import { computeWinProbability, type WinProbGame } from "@/lib/win-probability";

function makeGame(overrides: Partial<WinProbGame> = {}): WinProbGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 19,
    homeQ1: 3,
    homeQ2: 7,
    homeQ3: 7,
    homeQ4: 3,
    awayQ1: 3,
    awayQ2: 0,
    awayQ3: 10,
    awayQ4: 6,
    ...overrides,
  };
}

describe("computeWinProbability — empty", () => {
  it("returns empty arrays for no games", () => {
    const r = computeWinProbability([]);
    expect(r.halftimeLeadWinPct).toHaveLength(0);
    expect(r.q3LeadWinPct).toHaveLength(0);
    expect(r.comebackWinsByDeficit).toHaveLength(0);
    expect(r.biggestComebacks).toHaveLength(0);
    expect(r.teamClutchRating).toHaveLength(0);
  });
});

describe("computeWinProbability — halftime lead win pct", () => {
  it("calculates win pct when leading at halftime", () => {
    const games = [
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 3, awayQ2: 0, homeScore: 25, awayScore: 20 }), // home leading by 14, won
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 3, awayQ2: 0, homeScore: 20, awayScore: 25 }), // home leading by 14, lost
    ];
    const r = computeWinProbability(games);
    const leadRange = r.halftimeLeadWinPct.find((l) => l.leadRange === "8-14");
    expect(leadRange?.winPct).toBe("0.500");
    expect(leadRange?.sampleSize).toBe(2);
  });

  it("identifies different lead ranges", () => {
    const games = [
      makeGame({ homeQ1: 3, homeQ2: 0, awayQ1: 0, awayQ2: 0 }), // 3 point lead
      makeGame({ homeQ1: 7, homeQ2: 0, awayQ1: 0, awayQ2: 0 }), // 7 point lead
      makeGame({ homeQ1: 10, homeQ2: 0, awayQ1: 0, awayQ2: 0 }), // 10 point lead
    ];
    const r = computeWinProbability(games);
    const ranges = r.halftimeLeadWinPct.map((l) => l.leadRange);
    expect(ranges).toContain("1-3");
    expect(ranges).toContain("4-7");
    expect(ranges).toContain("8-14");
  });

  it("tracks trailing teams", () => {
    const games = [
      makeGame({ homeQ1: 0, homeQ2: 0, awayQ1: 3, awayQ2: 7, homeScore: 25, awayScore: 20 }), // away leading by 10, lost
    ];
    const r = computeWinProbability(games);
    // From leader's perspective: away was leading by 10 in range "8-14" and lost
    const leadEntry = r.halftimeLeadWinPct.find((l) => l.leadRange === "8-14");
    expect(leadEntry?.winPct).toBe("0.000");
    expect(leadEntry?.sampleSize).toBe(1);
  });
});

describe("computeWinProbability — Q3 lead win pct", () => {
  it("calculates win pct when leading at end of Q3", () => {
    const games = [
      makeGame({ homeQ1: 3, homeQ2: 7, homeQ3: 7, awayQ1: 3, awayQ2: 0, awayQ3: 0, homeScore: 25, awayScore: 20 }), // home leading 17-3 (diff=14), won
      makeGame({ homeQ1: 3, homeQ2: 7, homeQ3: 7, awayQ1: 3, awayQ2: 0, awayQ3: 0, homeScore: 20, awayScore: 25 }), // home leading 17-3 (diff=14), lost
    ];
    const r = computeWinProbability(games);
    // Q3 diff is 14, which falls in "8-14" range
    const leadRange = r.q3LeadWinPct.find((l) => l.leadRange === "8-14");
    expect(leadRange?.winPct).toBe("0.500");
  });

  it("includes Q3 comebacks", () => {
    const games = [
      makeGame({ homeQ1: 10, homeQ2: 10, homeQ3: 0, awayQ1: 0, awayQ2: 0, awayQ3: 10, homeScore: 20, awayScore: 25 }), // away trailing 20-10 after Q3, won
    ];
    const r = computeWinProbability(games);
    expect(r.q3LeadWinPct.length).toBeGreaterThan(0);
  });
});

describe("computeWinProbability — comeback wins by deficit", () => {
  it("tracks comebacks from halftime deficit", () => {
    const games = [
      makeGame({ homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // away trailing by 20, won
    ];
    const r = computeWinProbability(games);
    // Deficit of 20 falls in "15-21" range
    const deficitEntry = r.comebackWinsByDeficit.find((c) => c.deficit === "15-21");
    expect(deficitEntry?.wins).toBe(1);
  });

  it("counts comeback attempts", () => {
    const games = [
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 25, awayScore: 20 }), // away trailing by 14, lost
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // away trailing by 14, won
    ];
    const r = computeWinProbability(games);
    const deficitEntry = r.comebackWinsByDeficit.find((c) => c.deficit === "8-14");
    expect(deficitEntry?.total).toBe(2);
    expect(deficitEntry?.wins).toBe(1);
  });

  it("calculates win percentage for comeback attempts", () => {
    const games = [
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // win
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // win
      makeGame({ homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 25, awayScore: 20 }), // loss
    ];
    const r = computeWinProbability(games);
    const deficitEntry = r.comebackWinsByDeficit.find((c) => c.deficit === "8-14");
    expect(deficitEntry?.winPct).toBe("0.667");
  });
});

describe("computeWinProbability — biggest comebacks", () => {
  it("identifies biggest comebacks by halftime deficit", () => {
    const games = [
      makeGame({ homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // 20 point deficit
      makeGame({ homeQ1: 7, homeQ2: 0, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // 7 point deficit
    ];
    const r = computeWinProbability(games);
    expect(r.biggestComebacks[0].halfTimeDeficit).toBe(20);
    expect(r.biggestComebacks[1].halfTimeDeficit).toBe(7);
  });

  it("includes team names and scores", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }),
    ];
    const r = computeWinProbability(games);
    expect(r.biggestComebacks[0].homeTeamName).toBe("Chiefs");
    expect(r.biggestComebacks[0].awayTeamName).toBe("Ravens");
    expect(r.biggestComebacks[0].winningTeam).toBe("Ravens");
    expect(r.biggestComebacks[0].finalScore).toBe("25-20");
  });

  it("limits to top 10 biggest comebacks", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      return makeGame({
        season: 2024 + Math.floor(i / 15),
        homeQ1: 10,
        homeQ2: 10 - (i % 5),
        awayQ1: 0,
        awayQ2: 0,
        homeScore: 20 - (i % 3),
        awayScore: 25 + (i % 3),
      });
    });
    const r = computeWinProbability(games);
    expect(r.biggestComebacks.length).toBeLessThanOrEqual(10);
  });

  it("handles home team comebacks", () => {
    const games = [
      makeGame({ homeQ1: 0, homeQ2: 0, awayQ1: 10, awayQ2: 10, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeWinProbability(games);
    expect(r.biggestComebacks[0].winningTeam).toBe("Kansas City Chiefs");
  });
});

describe("computeWinProbability — team clutch rating", () => {
  it("calculates wins when trailing at halftime", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }), // Chiefs trailing, won
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 20, awayScore: 25 }), // Chiefs trailing, lost
    ];
    const r = computeWinProbability(games);
    const chiefs = r.teamClutchRating.find((t) => t.team === "Chiefs");
    expect(chiefs?.winsWhenTrailingAtHalf).toBe(1);
    expect(chiefs?.totalTrailingAtHalf).toBe(2);
  });

  it("calculates clutch percentage", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 20, awayScore: 25 }),
    ];
    const r = computeWinProbability(games);
    const chiefs = r.teamClutchRating.find((t) => t.team === "Chiefs");
    expect(chiefs?.clutchPct).toBe("0.667");
  });

  it("includes teams trailing as away team", () => {
    const games = [
      makeGame({ awayTeamName: "Ravens", homeQ1: 7, homeQ2: 7, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }),
    ];
    const r = computeWinProbability(games);
    const ravens = r.teamClutchRating.find((t) => t.team === "Ravens");
    expect(ravens?.winsWhenTrailingAtHalf).toBe(1);
  });

  it("limits to top 10 teams", () => {
    const games = Array.from({ length: 30 }, (_, i) => {
      const team = `Team${i}`;
      return makeGame({
        homeTeamName: team,
        homeQ1: 0,
        homeQ2: 0,
        awayQ1: 7,
        awayQ2: 7,
        homeScore: 25,
        awayScore: 20,
      });
    });
    const r = computeWinProbability(games);
    expect(r.teamClutchRating.length).toBeLessThanOrEqual(10);
  });

  it("sorts by clutch percentage descending", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Chiefs", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }),
      makeGame({ homeTeamName: "Ravens", homeQ1: 0, homeQ2: 0, awayQ1: 7, awayQ2: 7, homeScore: 25, awayScore: 20 }),
    ];
    const r = computeWinProbability(games);
    expect(r.teamClutchRating[0].team).toBe("Chiefs");
    expect(r.teamClutchRating[0].clutchPct).toBe("1.000");
  });
});

describe("computeWinProbability — ties", () => {
  it("skips tied games", () => {
    const games = [
      makeGame({ homeScore: 20, awayScore: 20 }),
      makeGame({ homeScore: 25, awayScore: 20 }),
    ];
    const r = computeWinProbability(games);
    expect(r.halftimeLeadWinPct.length).toBeGreaterThan(0);
  });
});

describe("computeWinProbability — integration", () => {
  it("handles multiple seasons", () => {
    const games = [
      makeGame({ season: 2023, homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }),
      makeGame({ season: 2024, homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }),
    ];
    const r = computeWinProbability(games);
    expect(r.biggestComebacks.length).toBe(2);
  });

  it("includes both home and away team comebacks", () => {
    const games = [
      makeGame({ homeTeamName: "Chiefs", awayTeamName: "Ravens", homeQ1: 10, homeQ2: 10, awayQ1: 0, awayQ2: 0, homeScore: 20, awayScore: 25 }), // away comeback
      makeGame({ homeTeamName: "Texans", awayTeamName: "Bengals", homeQ1: 0, homeQ2: 0, awayQ1: 10, awayQ2: 10, homeScore: 25, awayScore: 20 }), // home comeback
    ];
    const r = computeWinProbability(games);
    expect(r.biggestComebacks.length).toBe(2);
  });
});
