import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FranchiseHistoryDashboard from "@/components/franchise-history-dashboard";
import type { FranchiseHistoryResult } from "@/lib/franchise-history";

vi.mock("@/lib/franchise-history");

describe("FranchiseHistoryDashboard", () => {
  const mockData: FranchiseHistoryResult = {
    totalFranchises: 32,
    franchises: [
      {
        franchiseKey: "GB",
        franchiseName: "Green Bay Packers",
        allNames: ["Green Bay Packers"],
        totalWins: 780,
        totalLosses: 610,
        totalTies: 38,
        winPct: "56.1%",
        seasonRecords: [],
        bestSeason: {
          season: 2013,
          wins: 13,
          losses: 3,
          ties: 0,
        },
        worstSeason: {
          season: 1991,
          wins: 4,
          losses: 12,
          ties: 0,
        },
        superBowlWins: 3,
        superBowlAppearances: 4,
      },
      {
        franchiseKey: "LV",
        franchiseName: "Las Vegas Raiders",
        allNames: ["Oakland Raiders", "Los Angeles Raiders", "Las Vegas Raiders"],
        totalWins: 504,
        totalLosses: 576,
        totalTies: 12,
        winPct: "46.7%",
        seasonRecords: [],
        bestSeason: {
          season: 1983,
          wins: 12,
          losses: 4,
          ties: 0,
        },
        worstSeason: {
          season: 2003,
          wins: 4,
          losses: 12,
          ties: 0,
        },
        superBowlWins: 3,
        superBowlAppearances: 5,
      },
      {
        franchiseKey: "NE",
        franchiseName: "New England Patriots",
        allNames: ["New England Patriots"],
        totalWins: 690,
        totalLosses: 485,
        totalTies: 0,
        winPct: "58.7%",
        seasonRecords: [],
        bestSeason: {
          season: 2007,
          wins: 16,
          losses: 0,
          ties: 0,
        },
        worstSeason: {
          season: 1990,
          wins: 1,
          losses: 15,
          ties: 0,
        },
        superBowlWins: 6,
        superBowlAppearances: 11,
      },
    ],
  };

  it("renders loading state", () => {
    render(
      <FranchiseHistoryDashboard data={null} isLoading={true} isError={false} />
    );
    expect(screen.queryAllByText(/Loading franchise history data/i).length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(
      <FranchiseHistoryDashboard data={null} isLoading={false} isError={true} />
    );
    expect(screen.queryAllByText(/Failed to load franchise history data/i).length > 0).toBeTruthy();
  });

  it("returns null when no data", () => {
    const { container } = render(
      <FranchiseHistoryDashboard data={null} isLoading={false} isError={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders total franchises stat", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Total Franchises").length > 0).toBeTruthy();
    expect(screen.queryAllByText("32").length > 0).toBeTruthy();
  });

  it("renders franchise table", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Franchise Records").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Green Bay Packers").length > 0).toBeTruthy();
  });

  it("renders franchise records in table", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText(/780/).length > 0).toBeTruthy();
  });

  it("renders super bowl wins", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Super Bowl Wins").length > 0).toBeTruthy();
  });

  it("renders top franchises detail sections", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    // Top 3 franchises should show details
    const titles = screen.getAllByText(/Green Bay Packers|Las Vegas Raiders|New England Patriots/);
    expect(titles.length).toBeGreaterThan(0);
  });

  it("renders best season for franchise", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Best Season").length > 0).toBeTruthy();
  });

  it("renders worst season for franchise", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Worst Season").length > 0).toBeTruthy();
  });

  it("displays historical names for franchises with relocations", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Historical Names").length > 0).toBeTruthy();
    // Raiders had multiple names
    const badges = screen.getAllByText(/name\(s\)/);
    expect(badges.length).toBeGreaterThan(0);
  });

  it("renders total games stat", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Total Games").length > 0).toBeTruthy();
  });

  it("renders win percentage", () => {
    render(
      <FranchiseHistoryDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("56.1%").length > 0).toBeTruthy();
  });
});
