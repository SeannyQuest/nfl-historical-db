import { describe, it, expect } from "vitest";
import { computeConferenceTimeline, type ConferenceGame } from "@/lib/conference-timeline";

function makeGame(overrides: Partial<ConferenceGame> = {}): ConferenceGame {
  return {
    season: 2024,
    homeTeamName: "Kansas City Chiefs",
    awayTeamName: "Houston Texans",
    homeScore: 20,
    awayScore: 15,
    homeConference: "AFC",
    awayConference: "AFC",
    isPlayoff: false,
    ...overrides,
  };
}

describe("computeConferenceTimeline — empty input", () => {
  it("returns empty arrays for no games", () => {
    const r = computeConferenceTimeline([]);
    expect(r.seasonConferenceStrength).toHaveLength(0);
    expect(r.dominanceEras).toHaveLength(0);
    expect(r.crossConferenceRecord).toHaveLength(0);
  });
});

describe("computeConferenceTimeline — intra-conference filtering", () => {
  it("ignores same-conference games", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "AFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        homeConference: "AFC",
        awayConference: "AFC",
        homeScore: 25,
        awayScore: 10,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.seasonConferenceStrength).toHaveLength(0);
  });

  it("counts inter-conference games", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.seasonConferenceStrength).toHaveLength(1);
  });
});

describe("computeConferenceTimeline — conference records", () => {
  it("tracks AFC wins against NFC", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.afc.wins).toBe(1);
    expect(season.nfc.losses).toBe(1);
  });

  it("tracks NFC wins against AFC", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 10,
        awayScore: 20,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.nfc.wins).toBe(1);
    expect(season.afc.losses).toBe(1);
  });

  it("tracks away team conference wins", () => {
    const games = [
      makeGame({
        homeConference: "NFC",
        awayConference: "AFC",
        homeScore: 15,
        awayScore: 20,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.afc.wins).toBe(1);
  });
});

describe("computeConferenceTimeline — average margin", () => {
  it("calculates average point margin for conference", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 20, // 10-point margin
      }),
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 25,
        awayScore: 10, // 15-point margin
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.afc.avgMargin).toBe("12.5");
  });

  it("calculates zero margin for no games", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 15,
        awayScore: 20,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.afc.avgMargin).toBe("0.0");
  });
});

describe("computeConferenceTimeline — playoff tracking", () => {
  it("counts playoff wins separately", () => {
    const games = [
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
        isPlayoff: false,
      }),
      makeGame({
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 25,
        awayScore: 10,
        isPlayoff: true,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const season = r.seasonConferenceStrength[0];
    expect(season.afc.wins).toBe(2);
    expect(season.afc.playoffWins).toBe(1);
  });
});

describe("computeConferenceTimeline — cross-conference record", () => {
  it("tracks AFC wins vs NFC per season", () => {
    const games = [
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 10,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const record = r.crossConferenceRecord[0];
    expect(record.afcWinsVsNfc).toBe(1);
    expect(record.nfcWinsVsAfc).toBe(1);
  });

  it("separates records by season", () => {
    const games = [
      makeGame({
        season: 2023,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeConference: "NFC",
        awayConference: "AFC",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.crossConferenceRecord).toHaveLength(2);
    const record2023 = r.crossConferenceRecord.find((r) => r.season === 2023);
    const record2024 = r.crossConferenceRecord.find((r) => r.season === 2024);
    expect(record2023?.afcWinsVsNfc).toBe(1);
    expect(record2024?.nfcWinsVsAfc).toBe(1);
  });
});

describe("computeConferenceTimeline — dominance eras", () => {
  it("identifies single season dominance", () => {
    const games = [
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 10, // AFC margin = 20
      }),
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 28,
        awayScore: 12, // AFC margin = 16
      }),
    ];
    const r = computeConferenceTimeline(games);
    const era = r.dominanceEras.find((e) => e.conference === "AFC");
    expect(era).toBeDefined();
  });

  it("identifies multi-season dominance", () => {
    const games = [
      // 2023: AFC dominates (30-10 = 20 avg margin)
      makeGame({
        season: 2023,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 10,
      }),
      // 2024: AFC dominates (25-15 = 10 avg margin)
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 25,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    const era = r.dominanceEras.find((e) => e.conference === "AFC");
    expect(era?.fromSeason).toBe(2023);
    expect(era?.toSeason).toBe(2024);
  });

  it("calculates average margin advantage", () => {
    const games = [
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 10, // 20-point margin
      }),
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 20, // 10-point margin
      }),
    ];
    const r = computeConferenceTimeline(games);
    const era = r.dominanceEras.find((e) => e.conference === "AFC");
    expect(era?.avgMarginAdvantage).toBe("15.00");
  });

  it("handles era transitions", () => {
    const games = [
      // 2023: AFC dominates
      makeGame({
        season: 2023,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 30,
        awayScore: 10,
      }),
      // 2024: NFC dominates
      makeGame({
        season: 2024,
        homeConference: "NFC",
        awayConference: "AFC",
        homeScore: 30,
        awayScore: 10,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.dominanceEras.length).toBe(2);
    expect(r.dominanceEras[0].conference).toBe("AFC");
    expect(r.dominanceEras[1].conference).toBe("NFC");
  });
});

describe("computeConferenceTimeline — multi-season organization", () => {
  it("sorts seasons chronologically", () => {
    const games = [
      makeGame({
        season: 2025,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2023,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2024,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.seasonConferenceStrength[0].season).toBe(2023);
    expect(r.seasonConferenceStrength[1].season).toBe(2024);
    expect(r.seasonConferenceStrength[2].season).toBe(2025);
  });

  it("sorts cross-conference records chronologically", () => {
    const games = [
      makeGame({
        season: 2025,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
      makeGame({
        season: 2023,
        homeConference: "AFC",
        awayConference: "NFC",
        homeScore: 20,
        awayScore: 15,
      }),
    ];
    const r = computeConferenceTimeline(games);
    expect(r.crossConferenceRecord[0].season).toBe(2023);
    expect(r.crossConferenceRecord[1].season).toBe(2025);
  });
});
