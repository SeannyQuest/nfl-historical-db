import { describe, it, expect } from "vitest";
import {
  computeCbbSeasonSummary,
  computeCbbTournamentSummary,
  type CbbAnalyticsGame,
} from "@/lib/cbb-analytics";

describe("CBB Analytics - Season Summary", () => {
  it("should compute season summary with empty games array", () => {
    const summary = computeCbbSeasonSummary([]);

    expect(summary.totalGames).toBe(0);
    expect(summary.avgScore).toBe("0.0");
    expect(summary.topTeams).toHaveLength(0);
    expect(summary.conferenceStats).toHaveLength(0);
  });

  it("should compute season summary with sample games", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Duke",
        awayTeamName: "UNC",
        homeScore: 72,
        awayScore: 68,
        homeConference: "ACC",
        awayConference: "ACC",
        isTournament: false,
        tournamentRound: null,
      },
      {
        season: 2024,
        homeTeamName: "Kansas",
        awayTeamName: "Duke",
        homeScore: 75,
        awayScore: 80,
        homeConference: "Big 12",
        awayConference: "ACC",
        isTournament: false,
        tournamentRound: null,
      },
    ];

    const summary = computeCbbSeasonSummary(games);

    expect(summary.totalGames).toBe(2);
    expect(summary.season).toBe(2024);
    expect(parseFloat(summary.avgScore)).toBeGreaterThan(0);
  });

  it("should identify top teams by wins", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Team X",
        awayTeamName: "Team Y",
        homeScore: 80,
        awayScore: 60,
        homeConference: "Conf1",
        awayConference: "Conf2",
        isTournament: false,
        tournamentRound: null,
      },
      {
        season: 2024,
        homeTeamName: "Team X",
        awayTeamName: "Team Z",
        homeScore: 85,
        awayScore: 70,
        homeConference: "Conf1",
        awayConference: "Conf3",
        isTournament: false,
        tournamentRound: null,
      },
      {
        season: 2024,
        homeTeamName: "Team Y",
        awayTeamName: "Team Z",
        homeScore: 90,
        awayScore: 88,
        homeConference: "Conf2",
        awayConference: "Conf3",
        isTournament: false,
        tournamentRound: null,
      },
    ];

    const summary = computeCbbSeasonSummary(games);

    expect(summary.topTeams.length).toBeGreaterThan(0);
    expect(summary.topTeams[0].wins).toBeGreaterThanOrEqual(
      summary.topTeams[1]?.wins || 0
    );
  });

  it("should calculate conference statistics", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Duke",
        awayTeamName: "UNC",
        homeScore: 75,
        awayScore: 70,
        homeConference: "ACC",
        awayConference: "ACC",
        isTournament: false,
        tournamentRound: null,
      },
    ];

    const summary = computeCbbSeasonSummary(games);

    expect(summary.conferenceStats.length).toBeGreaterThan(0);
    const accConf = summary.conferenceStats.find((c) => c.conference === "ACC");
    expect(accConf).toBeDefined();
  });
});

describe("CBB Analytics - Tournament Summary", () => {
  it("should return empty tournament summary with no games", () => {
    const summary = computeCbbTournamentSummary([]);

    expect(summary.totalGames).toBe(0);
    expect(summary.avgMargin).toBe("0.0");
    expect(summary.biggestUpsets).toHaveLength(0);
  });

  it("should compute tournament summary with tournament games", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Duke",
        awayTeamName: "UNC",
        homeScore: 72,
        awayScore: 68,
        homeConference: "ACC",
        awayConference: "ACC",
        isTournament: true,
        tournamentRound: "Round of 64",
      },
      {
        season: 2024,
        homeTeamName: "Kansas",
        awayTeamName: "Duke",
        homeScore: 60,
        awayScore: 75,
        homeConference: "Big 12",
        awayConference: "ACC",
        isTournament: true,
        tournamentRound: "Round of 32",
      },
    ];

    const summary = computeCbbTournamentSummary(games);

    expect(summary.totalGames).toBe(2);
    expect(summary.season).toBe(2024);
    expect(parseFloat(summary.avgMargin)).toBeGreaterThanOrEqual(0);
  });

  it("should identify biggest upsets in tournament", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Team A",
        awayTeamName: "Team B",
        homeScore: 50,
        awayScore: 70,
        homeConference: "Conf1",
        awayConference: "Conf2",
        isTournament: true,
        tournamentRound: "Round of 64",
      },
      {
        season: 2024,
        homeTeamName: "Team C",
        awayTeamName: "Team D",
        homeScore: 55,
        awayScore: 80,
        homeConference: "Conf3",
        awayConference: "Conf4",
        isTournament: true,
        tournamentRound: "Round of 32",
      },
    ];

    const summary = computeCbbTournamentSummary(games);

    expect(summary.biggestUpsets.length).toBeGreaterThan(0);
    summary.biggestUpsets.forEach((upset) => {
      expect(upset.team).toBeTruthy();
      expect(upset.opponent).toBeTruthy();
      expect(upset.margin).toBeGreaterThan(0);
    });
  });

  it("should filter out non-tournament games", () => {
    const games: CbbAnalyticsGame[] = [
      {
        season: 2024,
        homeTeamName: "Duke",
        awayTeamName: "UNC",
        homeScore: 75,
        awayScore: 70,
        homeConference: "ACC",
        awayConference: "ACC",
        isTournament: false,
        tournamentRound: null,
      },
      {
        season: 2024,
        homeTeamName: "Kansas",
        awayTeamName: "Duke",
        homeScore: 65,
        awayScore: 80,
        homeConference: "Big 12",
        awayConference: "ACC",
        isTournament: true,
        tournamentRound: "Round of 64",
      },
    ];

    const summary = computeCbbTournamentSummary(games);

    expect(summary.totalGames).toBe(1); // Only tournament game
  });
});
