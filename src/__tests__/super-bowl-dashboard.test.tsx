import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SuperBowlDashboard from "@/components/super-bowl-dashboard";
import type { SuperBowlStats } from "@/lib/super-bowl";

vi.mock("@/lib/super-bowl");

describe("SuperBowlDashboard", () => {
  const mockStats: SuperBowlStats = {
    totalSuperBowls: 58,
    championsByYear: [
      {
        season: 2024,
        champion: "Kansas City Chiefs",
        score: "25-22",
        opponent: "San Francisco 49ers",
        spread: "3",
      },
      {
        season: 2023,
        champion: "Kansas City Chiefs",
        score: "38-35",
        opponent: "Philadelphia Eagles",
        spread: "3",
      },
    ],
    biggestBlowouts: [
      {
        season: 1990,
        score: "55-10",
        margin: 45,
        winner: "San Francisco 49ers",
        loser: "Denver Broncos",
      },
      {
        season: 2014,
        score: "43-8",
        margin: 35,
        winner: "Seattle Seahawks",
        loser: "Denver Broncos",
      },
    ],
    closestGames: [
      {
        season: 2022,
        score: "23-20",
        margin: 3,
        winner: "Los Angeles Rams",
        loser: "Cincinnati Bengals",
      },
      {
        season: 2025,
        score: "25-22",
        margin: 3,
        winner: "Kansas City Chiefs",
        loser: "San Francisco 49ers",
      },
    ],
    mostAppearances: [
      { team: "New England Patriots", count: 11, wins: 6, losses: 5 },
      { team: "Pittsburgh Steelers", count: 8, wins: 6, losses: 2 },
      { team: "Dallas Cowboys", count: 8, wins: 5, losses: 3 },
    ],
    dynastyTracker: [
      {
        team: "Kansas City Chiefs",
        wins: 3,
        appearances: 5,
        winPct: "0.600",
        era: "2020+",
      },
      {
        team: "New England Patriots",
        wins: 6,
        appearances: 11,
        winPct: "0.545",
        era: "2000-2009/2010-2019",
      },
    ],
  };

  const mockData = { stats: mockStats };

  it("renders loading state", () => {
    render(<SuperBowlDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.queryAllByText(/Loading Super Bowl stats/i).length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(<SuperBowlDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.queryAllByText(/Failed to load Super Bowl stats/i).length > 0).toBeTruthy();
  });

  it("returns null when no data", () => {
    const { container } = render(
      <SuperBowlDashboard data={null} isLoading={false} isError={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders total Super Bowls stat", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Total Super Bowls").length > 0).toBeTruthy();
    expect(screen.queryAllByText("58").length > 0).toBeTruthy();
  });

  it("renders most appearances team", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Most Appearances").length > 0).toBeTruthy();
    expect(screen.queryAllByText("New England Patriots").length > 0).toBeTruthy();
  });

  it("renders Super Bowl Champions section", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Super Bowl Champions").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
  });

  it("renders champion scores", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("25-22").length > 0).toBeTruthy();
    expect(screen.queryAllByText("38-35").length > 0).toBeTruthy();
  });

  it("renders Biggest Blowouts section", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Biggest Blowouts").length > 0).toBeTruthy();
    expect(screen.queryAllByText("San Francisco 49ers").length > 0).toBeTruthy();
  });

  it("renders blowout margins", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("45").length > 0).toBeTruthy();
    expect(screen.queryAllByText("35").length > 0).toBeTruthy();
  });

  it("renders Closest Games section", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Closest Games").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Los Angeles Rams").length > 0).toBeTruthy();
  });

  it("renders Most Appearances section", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Most Super Bowl Appearances").length > 0).toBeTruthy();
  });

  it("renders appearance counts", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("11").length > 0).toBeTruthy();
    expect(screen.queryAllByText("8").length > 0).toBeTruthy();
  });

  it("renders Dynasty Tracker section", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Super Bowl Dynasty Tracker").length > 0).toBeTruthy();
  });

  it("renders dynasty win percentages", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("0.600").length > 0).toBeTruthy();
    expect(screen.queryAllByText("0.545").length > 0).toBeTruthy();
  });

  it("renders runner-up teams", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("San Francisco 49ers").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Philadelphia Eagles").length > 0).toBeTruthy();
  });

  it("renders season years", () => {
    render(<SuperBowlDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("2024").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
  });
});
