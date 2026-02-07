import { describe, it, expect } from "vitest";
import {
  computeCfbSeasonSummary,
  type CfbAnalyticsGame,
} from "@/lib/cfb-analytics";

describe("CFB Analytics", () => {
  it("should compute season summary with empty games array", () => {
    const summary = computeCfbSeasonSummary([]);

    expect(summary.totalGames).toBe(0);
    expect(summary.avgScore).toBe("0.0");
    expect(summary.topTeams).toHaveLength(0);
    expect(summary.conferenceStats).toHaveLength(0);
  });

  it("should compute season summary with sample games", () => {
    const games: CfbAnalyticsGame[] = [
      {
        season: 2023,
        week: "1",
        homeTeamName: "Alabama",
        awayTeamName: "Texas",
        homeScore: 35,
        awayScore: 31,
        homeConference: "SEC",
        awayConference: "Big 12",
        isPlayoff: false,
      },
      {
        season: 2023,
        week: "2",
        homeTeamName: "Ohio State",
        awayTeamName: "Alabama",
        homeScore: 38,
        awayScore: 20,
        homeConference: "Big Ten",
        awayConference: "SEC",
        isPlayoff: false,
      },
    ];

    const summary = computeCfbSeasonSummary(games);

    expect(summary.totalGames).toBe(2);
    expect(summary.season).toBe(2023);
    expect(parseFloat(summary.avgScore)).toBeGreaterThan(0);
    expect(summary.topTeams.length).toBeGreaterThan(0);
  });

  it("should rank teams correctly by wins", () => {
    const games: CfbAnalyticsGame[] = [
      {
        season: 2023,
        week: "1",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 30,
        awayScore: 10,
        homeConference: "Conf1",
        awayConference: "Conf2",
        isPlayoff: false,
      },
      {
        season: 2023,
        week: "2",
        homeTeamName: "Team A",
        awayTeamName: "Team C",
        homeScore: 25,
        awayScore: 20,
        homeConference: "Conf1",
        awayConference: "Conf3",
        isPlayoff: false,
      },
      {
        season: 2023,
        week: "3",
        homeTeamName: "Team B",
        awayTeamName: "Team C",
        homeScore: 28,
        awayScore: 24,
        homeConference: "Conf2",
        awayConference: "Conf3",
        isPlayoff: false,
      },
    ];

    const summary = computeCfbSeasonSummary(games);

    expect(summary.topTeams[0].wins).toBeGreaterThanOrEqual(
      summary.topTeams[1]?.wins || 0
    );
  });

  it("should calculate conference statistics", () => {
    const games: CfbAnalyticsGame[] = [
      {
        season: 2023,
        week: "1",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 28,
        awayScore: 14,
        homeConference: "SEC",
        awayConference: "ACC",
        isPlayoff: false,
      },
      {
        season: 2023,
        week: "2",
        homeTeamName: "Team C",
        awayTeamName: "Team A",
        homeScore: 21,
        awayScore: 35,
        homeConference: "Big Ten",
        awayConference: "SEC",
        isPlayoff: false,
      },
    ];

    const summary = computeCfbSeasonSummary(games);

    expect(summary.conferenceStats.length).toBeGreaterThan(0);
    summary.conferenceStats.forEach((conf) => {
      expect(conf.conference).toBeTruthy();
      expect(conf.wins).toBeGreaterThanOrEqual(0);
      expect(conf.losses).toBeGreaterThanOrEqual(0);
    });
  });

  it("should calculate average margin correctly for conferences", () => {
    const games: CfbAnalyticsGame[] = [
      {
        season: 2023,
        week: "1",
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 40,
        awayScore: 10,
        homeConference: "SEC",
        awayConference: "ACC",
        isPlayoff: false,
      },
      {
        season: 2023,
        week: "2",
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeScore: 35,
        awayScore: 25,
        homeConference: "SEC",
        awayConference: "Big Ten",
        isPlayoff: false,
      },
    ];

    const summary = computeCfbSeasonSummary(games);

    const secConf = summary.conferenceStats.find((c) => c.conference === "SEC");
    if (secConf) {
      const avgMargin = parseFloat(secConf.avgMargin);
      expect(avgMargin).toBeGreaterThan(0);
    }
  });
});
