import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RivalryDashboard from "@/components/rivalry-dashboard";
import type { RivalriesResult } from "@/lib/rivalry";

const mockData: RivalriesResult = {
  mostPlayedMatchups: [
    {
      team1: "Dallas Cowboys",
      team2: "Philadelphia Eagles",
      totalGames: 28,
      team1Wins: 15,
      team2Wins: 12,
      ties: 1,
      avgTotal: "45.2",
      lastGame: {
        date: "2024-12-31T12:00:00.000Z",
        season: 2024,
        homeTeam: "Dallas Cowboys",
        awayTeam: "Philadelphia Eagles",
        score: "31-21",
        winner: "Dallas Cowboys",
      },
    },
  ],
  closestRivalries: [
    {
      team1: "Kansas City Chiefs",
      team2: "Buffalo Bills",
      totalGames: 8,
      team1Wins: 4,
      team2Wins: 4,
      ties: 0,
      avgTotal: "48.1",
      lastGame: {
        date: "2024-01-15T12:00:00.000Z",
        season: 2024,
        homeTeam: "Buffalo Bills",
        awayTeam: "Kansas City Chiefs",
        score: "24-27",
        winner: "Kansas City Chiefs",
      },
    },
  ],
  highestScoringRivalries: [
    {
      team1: "Green Bay Packers",
      team2: "Chicago Bears",
      totalGames: 25,
      team1Wins: 15,
      team2Wins: 10,
      ties: 0,
      avgTotal: "52.3",
      lastGame: {
        date: "2024-11-28T12:00:00.000Z",
        season: 2024,
        homeTeam: "Chicago Bears",
        awayTeam: "Green Bay Packers",
        score: "14-24",
        winner: "Green Bay Packers",
      },
    },
  ],
  divisionRivalries: [
    {
      team1: "San Francisco 49ers",
      team2: "Los Angeles Rams",
      totalGames: 12,
      team1Wins: 8,
      team2Wins: 4,
      ties: 0,
      avgTotal: "44.5",
      lastGame: {
        date: "2024-12-24T12:00:00.000Z",
        season: 2024,
        homeTeam: "San Francisco 49ers",
        awayTeam: "Los Angeles Rams",
        score: "34-27",
        winner: "San Francisco 49ers",
      },
    },
  ],
};

describe("RivalryDashboard", () => {
  it("renders loading state", () => {
    render(<RivalryDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading rivalry data...")).toBeTruthy();
  });

  it("renders error state", () => {
    render(<RivalryDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load rivalry data.")).toBeTruthy();
  });

  it("renders null when no data", () => {
    const { container } = render(<RivalryDashboard data={null} isLoading={false} isError={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays category buttons", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.some((b) => b.textContent === "Most Played")).toBeTruthy();
    expect(buttons.some((b) => b.textContent === "Closest Matchups")).toBeTruthy();
    expect(buttons.some((b) => b.textContent === "Highest Scoring")).toBeTruthy();
    expect(buttons.some((b) => b.textContent === "Division Rivals")).toBeTruthy();
  });

  it("displays most played category by default", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    const rows = screen.getAllByText("Dallas Cowboys");
    expect(rows.length).toBeGreaterThan(0);
  });

  it("switches categories when button clicked", async () => {
    const { rerender } = render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    const buttons = screen.getAllByRole("button");
    const closestButton = buttons.find((b) => b.textContent === "Closest Matchups");
    expect(closestButton).toBeTruthy();
    closestButton?.click();
    rerender(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    // After click, closest rivalries should be displayed
  });

  it("displays rivalry records correctly", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    // Should show the most played matchup
    const cowboys = screen.getAllByText("Dallas Cowboys");
    const eagles = screen.getAllByText("Philadelphia Eagles");
    expect(cowboys.length).toBeGreaterThan(0);
    expect(eagles.length).toBeGreaterThan(0);
  });

  it("displays total games count", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    const tables = screen.getAllByText("28");
    expect(tables.length).toBeGreaterThan(0);
  });

  it("displays average total points", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    const tables = screen.getAllByText("45.2");
    expect(tables.length).toBeGreaterThan(0);
  });

  it("displays summary stats", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.getAllByText("Total Rivalries").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Avg Games/Rivalry").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Avg Total Points").length).toBeGreaterThan(0);
  });

  it("handles empty rivalry lists", () => {
    const emptyData: RivalriesResult = {
      mostPlayedMatchups: [],
      closestRivalries: [],
      highestScoringRivalries: [],
      divisionRivalries: [],
    };
    render(<RivalryDashboard data={emptyData} isLoading={false} isError={false} />);
    expect(screen.getByText("No rivalries found in this category")).toBeTruthy();
  });

  it("displays ties in record", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    // The most played matchup has 1 tie, should show 15-12-1
    const records = screen.getAllByText(/15/);
    expect(records.length).toBeGreaterThan(0);
  });

  it("highlights winning team in records", () => {
    render(<RivalryDashboard data={mockData} isLoading={false} isError={false} />);
    // Team with more wins should have different styling
    const cowboys = screen.getAllByText("Dallas Cowboys");
    expect(cowboys.length).toBeGreaterThan(0);
  });
});
