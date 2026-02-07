import { describe, it, expect } from "vitest";
import { computeDivisionDominance, type DivisionGame } from "@/lib/division-dominance";

function makeGame(overrides: Partial<DivisionGame> = {}): DivisionGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 30,
    awayScore: 24,
    homeDivision: "AFC West",
    awayDivision: "AFC South",
    homeConference: "AFC",
    awayConference: "AFC",
    isDivisional: false,
    ...overrides,
  };
}

describe("computeDivisionDominance — empty", () => {
  it("returns empty data for no games", () => {
    const r = computeDivisionDominance([]);
    expect(r.divisionRankings).toHaveLength(0);
    expect(r.headToHead).toHaveLength(0);
    expect(r.dynastyDivisions).toHaveLength(0);
    expect(r.seasonTrends).toHaveLength(0);
  });
});

describe("computeDivisionDominance — division rankings", () => {
  it("ranks divisions by win percentage", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", homeScore: 30, awayScore: 20, awayDivision: "NFC South" }),
      makeGame({ homeDivision: "AFC West", homeScore: 28, awayScore: 20, awayDivision: "NFC South" }),
      makeGame({ homeDivision: "AFC South", homeScore: 15, awayScore: 35, awayDivision: "AFC West" }),
    ];
    const r = computeDivisionDominance(games);
    const westRanking = r.divisionRankings.find((d) => d.division === "AFC West");
    const southRanking = r.divisionRankings.find((d) => d.division === "AFC South");
    expect(westRanking!.winPct).toBeGreaterThan(southRanking!.winPct);
  });

  it("calculates division records", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", homeScore: 30, awayScore: 20, awayDivision: "NFC South" }),
      makeGame({ homeDivision: "AFC West", homeScore: 20, awayScore: 30, awayDivision: "NFC South" }),
    ];
    const r = computeDivisionDominance(games);
    const westRanking = r.divisionRankings.find((d) => d.division === "AFC West");
    expect(westRanking?.divisionRecord).toBe("1-1");
  });

  it("calculates average points for and against", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", homeScore: 30, awayScore: 20, awayDivision: "NFC South" }),
      makeGame({ homeDivision: "AFC West", homeScore: 28, awayScore: 22, awayDivision: "NFC South" }),
    ];
    const r = computeDivisionDominance(games);
    const westRanking = r.divisionRankings.find((d) => d.division === "AFC West");
    expect(westRanking?.avgPointsFor).toBe(29);
    expect(westRanking?.avgPointsAgainst).toBe(21);
  });

  it("sorts by win percentage descending", () => {
    const games = [
      makeGame({ homeDivision: "Division1", homeScore: 30, awayScore: 20, awayDivision: "Division2" }),
      makeGame({ homeDivision: "Division1", homeScore: 30, awayScore: 20, awayDivision: "Division3" }),
      makeGame({ homeDivision: "Division2", homeScore: 20, awayScore: 30, awayDivision: "Division1" }),
    ];
    const r = computeDivisionDominance(games);
    expect(r.divisionRankings[0].division).toBe("Division1");
    expect(r.divisionRankings[0].winPct).toBeGreaterThanOrEqual(r.divisionRankings[1].winPct);
  });
});

describe("computeDivisionDominance — head-to-head", () => {
  it("compares divisions that play each other", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", awayDivision: "NFC South", homeScore: 30, awayScore: 20 }),
      makeGame({ homeDivision: "AFC West", awayDivision: "NFC South", homeScore: 28, awayScore: 20 }),
      makeGame({ homeDivision: "AFC South", awayDivision: "NFC West", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeDivisionDominance(games);
    expect(r.headToHead.length).toBeGreaterThan(0);
  });

  it("counts wins and losses between divisions", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", awayDivision: "NFC South", homeScore: 30, awayScore: 20 }),
      makeGame({ homeDivision: "AFC West", awayDivision: "NFC South", homeScore: 20, awayScore: 30 }),
    ];
    const r = computeDivisionDominance(games);
    const h2h = r.headToHead.find(
      (h) =>
        (h.div1 === "AFC West" && h.div2 === "NFC South") ||
        (h.div1 === "NFC South" && h.div2 === "AFC West")
    );
    expect(h2h?.wins).toBe(1);
    expect(h2h?.losses).toBe(1);
  });

  it("ignores same-division games", () => {
    const games = [
      makeGame({ homeDivision: "AFC West", awayDivision: "AFC West", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeDivisionDominance(games);
    const h2h = r.headToHead.find(
      (h) => (h.div1 === "AFC West" && h.div2 === "AFC West")
    );
    expect(h2h).toBeUndefined();
  });

  it("sorts by wins descending", () => {
    const games = [
      makeGame({ homeDivision: "Div1", awayDivision: "Div2", homeScore: 30, awayScore: 20 }),
      makeGame({ homeDivision: "Div1", awayDivision: "Div2", homeScore: 30, awayScore: 20 }),
      makeGame({ homeDivision: "Div3", awayDivision: "Div4", homeScore: 30, awayScore: 20 }),
    ];
    const r = computeDivisionDominance(games);
    expect(r.headToHead[0].wins).toBeGreaterThanOrEqual(r.headToHead[1]?.wins ?? 0);
  });
});

describe("computeDivisionDominance — dynasty divisions", () => {
  it("identifies divisions with multiple strong seasons", () => {
    const games = [
      makeGame({ season: 2023, homeDivision: "Dynasty", homeScore: 30, awayScore: 20, awayDivision: "Other" }),
      makeGame({ season: 2023, homeDivision: "Dynasty", homeScore: 30, awayScore: 20, awayDivision: "Other" }),
      makeGame({ season: 2024, homeDivision: "Dynasty", homeScore: 30, awayScore: 20, awayDivision: "Other" }),
      makeGame({ season: 2024, homeDivision: "Dynasty", homeScore: 30, awayScore: 20, awayDivision: "Other" }),
    ];
    const r = computeDivisionDominance(games);
    const dynasty = r.dynastyDivisions.find((d) => d.division === "Dynasty");
    expect(dynasty?.seasonCount).toBe(2);
  });

  it("calculates average win percentage across seasons", () => {
    const games = [
      makeGame({ season: 2023, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
      makeGame({ season: 2024, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
    ];
    const r = computeDivisionDominance(games);
    const div1 = r.dynastyDivisions.find((d) => d.division === "Div1");
    expect(div1?.avgWinPct).toBeGreaterThan(0);
  });

  it("only includes divisions with 2+ seasons", () => {
    const games = [
      makeGame({ season: 2023, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
      makeGame({ season: 2023, homeDivision: "Div3", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
    ];
    const r = computeDivisionDominance(games);
    const div3 = r.dynastyDivisions.find((d) => d.division === "Div3");
    expect(div3).toBeUndefined();
  });

  it("includes season numbers", () => {
    const games = [
      makeGame({ season: 2022, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
      makeGame({ season: 2023, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
    ];
    const r = computeDivisionDominance(games);
    const div1 = r.dynastyDivisions.find((d) => d.division === "Div1");
    expect(div1?.seasons).toContain(2022);
    expect(div1?.seasons).toContain(2023);
  });
});

describe("computeDivisionDominance — season trends", () => {
  it("identifies best division per season", () => {
    const games = [
      makeGame({ season: 2024, homeDivision: "Strong", homeScore: 30, awayScore: 20, awayDivision: "Weak" }),
      makeGame({ season: 2024, homeDivision: "Strong", homeScore: 30, awayScore: 20, awayDivision: "Weak" }),
      makeGame({ season: 2024, homeDivision: "Weak", homeScore: 10, awayScore: 40, awayDivision: "Strong" }),
    ];
    const r = computeDivisionDominance(games);
    const trend = r.seasonTrends.find((t) => t.season === 2024);
    expect(trend?.bestDivision).toBe("Strong");
  });

  it("identifies worst division per season", () => {
    const games = [
      makeGame({ season: 2024, homeDivision: "Strong", homeScore: 30, awayScore: 20, awayDivision: "Weak" }),
      makeGame({ season: 2024, homeDivision: "Strong", homeScore: 30, awayScore: 20, awayDivision: "Weak" }),
      makeGame({ season: 2024, homeDivision: "Weak", homeScore: 10, awayScore: 40, awayDivision: "Strong" }),
    ];
    const r = computeDivisionDominance(games);
    const trend = r.seasonTrends.find((t) => t.season === 2024);
    expect(trend?.worstDivision).toBe("Weak");
  });

  it("sorts by season ascending", () => {
    const games = [
      makeGame({ season: 2024, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
      makeGame({ season: 2020, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
      makeGame({ season: 2022, homeDivision: "Div1", homeScore: 30, awayScore: 20, awayDivision: "Div2" }),
    ];
    const r = computeDivisionDominance(games);
    expect(r.seasonTrends[0].season).toBe(2020);
    expect(r.seasonTrends[1].season).toBe(2022);
    expect(r.seasonTrends[2].season).toBe(2024);
  });
});

describe("computeDivisionDominance — away team handling", () => {
  it("correctly attributes away team victories to division", () => {
    const games = [
      makeGame({ awayDivision: "AFC West", homeScore: 20, awayScore: 30, awayTeamName: "Team" }),
    ];
    const r = computeDivisionDominance(games);
    const westRanking = r.divisionRankings.find((d) => d.division === "AFC West");
    expect(westRanking?.wins).toBeGreaterThan(0);
  });
});

describe("computeDivisionDominance — comprehensive", () => {
  it("handles full season data", () => {
    const games = Array.from({ length: 20 }, (_, i) =>
      makeGame({
        season: 2024,
        homeTeamName: `HomeTeam${i}`,
        awayTeamName: `AwayTeam${i}`,
        homeDivision: i < 10 ? "AFC West" : "NFC East",
        awayDivision: i < 10 ? "NFC South" : "AFC South",
        homeScore: 30 + (i % 5),
        awayScore: 20 + (i % 5),
      })
    );
    const r = computeDivisionDominance(games);
    expect(r.divisionRankings.length).toBeGreaterThan(0);
    expect(r.seasonTrends.length).toBeGreaterThan(0);
  });
});
