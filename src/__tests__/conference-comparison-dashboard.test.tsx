import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ConferenceComparisonDashboard from "@/components/conference-comparison-dashboard";
import type { ConferenceComparisonResult } from "@/lib/conference-comparison";

vi.mock("@/lib/conference-comparison");

describe("ConferenceComparisonDashboard", () => {
  const mockData: ConferenceComparisonResult = {
    afcStats: {
      totalWins: 312,
      totalLosses: 288,
      totalTies: 0,
      winPct: "0.520",
      superBowlWins: 27,
      superBowlAppearances: 58,
      homeWins: 160,
      homeLosses: 140,
      homeWinPct: "0.533",
      awayWins: 152,
      awayLosses: 148,
      awayWinPct: "0.507",
      atsWins: 310,
      atsTotal: 600,
      atsPct: "0.517",
      avgHomeScore: "23.4",
      avgAwayScore: "22.1",
    },
    nflStats: {
      totalWins: 288,
      totalLosses: 312,
      totalTies: 0,
      winPct: "0.480",
      superBowlWins: 31,
      superBowlAppearances: 58,
      homeWins: 140,
      homeLosses: 160,
      homeWinPct: "0.467",
      awayWins: 148,
      awayLosses: 152,
      awayWinPct: "0.493",
      atsWins: 290,
      atsTotal: 600,
      atsPct: "0.483",
      avgHomeScore: "22.1",
      avgAwayScore: "23.4",
    },
    crossConferenceGames: 600,
    superBowlStats: { afcWins: 27, nflWins: 31 },
    seasonComparisons: [
      {
        season: 2024,
        afcWins: 16,
        nflWins: 14,
        ties: 0,
      },
      {
        season: 2023,
        afcWins: 15,
        nflWins: 15,
        ties: 0,
      },
    ],
  };

  it("renders loading state", () => {
    render(
      <ConferenceComparisonDashboard data={null} isLoading={true} isError={false} />
    );
    expect(screen.queryAllByText(/Loading conference comparison data/i).length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(
      <ConferenceComparisonDashboard data={null} isLoading={false} isError={true} />
    );
    expect(screen.queryAllByText(/Failed to load conference comparison data/i).length > 0).toBeTruthy();
  });

  it("returns null when no data", () => {
    const { container } = render(
      <ConferenceComparisonDashboard data={null} isLoading={false} isError={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders cross-conference games stat", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Cross-Conf Games").length > 0).toBeTruthy();
    expect(screen.queryAllByText("600").length > 0).toBeTruthy();
  });

  it("renders AFC head-to-head win percentage", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("AFC Head-to-Head %").length > 0).toBeTruthy();
  });

  it("renders AFC statistics panel", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("AFC Statistics").length > 0).toBeTruthy();
  });

  it("renders NFC statistics panel", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("NFC Statistics").length > 0).toBeTruthy();
  });

  it("renders AFC record", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("312-288-0").length > 0).toBeTruthy();
  });

  it("renders AFC win percentage", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("0.520").length > 0).toBeTruthy();
  });

  it("renders home/away splits", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.getAllByText("Home Win %").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Away Win %").length).toBeGreaterThan(0);
  });

  it("renders ATS records", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.getAllByText("ATS Record").length).toBeGreaterThan(0);
  });

  it("renders Super Bowl stats", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("AFC SB Wins").length > 0).toBeTruthy();
    expect(screen.queryAllByText("27").length > 0).toBeTruthy();
    expect(screen.queryAllByText("NFC SB Wins").length > 0).toBeTruthy();
    expect(screen.queryAllByText("31").length > 0).toBeTruthy();
  });

  it("renders season-by-season table", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Season-by-Season Conference Head-to-Head").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2024").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
  });

  it("renders Super Bowl summary", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Super Bowl Results").length > 0).toBeTruthy();
  });

  it("displays scoring averages", () => {
    render(
      <ConferenceComparisonDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("23.4").length > 0).toBeTruthy();
    expect(screen.queryAllByText("22.1").length > 0).toBeTruthy();
  });
});
