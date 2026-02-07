import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ByeWeekDashboard from "@/components/bye-week-dashboard";
import type { ByeWeekStats } from "@/lib/bye-week";

vi.mock("@/lib/bye-week");

describe("ByeWeekDashboard", () => {
  const mockStats: ByeWeekStats = {
    totalGames: 512,
    recordOnBye: {
      wins: 145,
      losses: 140,
      ties: 2,
      winPct: "0.509",
    },
    recordNotOnBye: {
      wins: 110,
      losses: 115,
      ties: 0,
      winPct: "0.489",
    },
    coverRateOnBye: "0.510",
    coverRateNotOnBye: "0.495",
    scoringDifferentialOnBye: "1.2",
    scoringDifferentialNotOnBye: "-0.8",
    byeWeekTrends: [
      {
        season: 2024,
        gamesOnBye: 32,
        byeWinPct: "0.520",
        gamesNotOnBye: 240,
        notByeWinPct: "0.485",
      },
      {
        season: 2023,
        gamesOnBye: 32,
        byeWinPct: "0.500",
        gamesNotOnBye: 240,
        notByeWinPct: "0.495",
      },
    ],
    opponentOnByeStats: {
      wins: 155,
      losses: 145,
      ties: 1,
      winPct: "0.517",
    },
  };

  const mockData = { stats: mockStats };

  it("renders loading state", () => {
    render(
      <ByeWeekDashboard data={null} isLoading={true} isError={false} />
    );
    expect(screen.queryAllByText(/Loading bye week impact data/i).length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(
      <ByeWeekDashboard data={null} isLoading={false} isError={true} />
    );
    expect(screen.queryAllByText(/Failed to load bye week impact data/i).length > 0).toBeTruthy();
  });

  it("returns null when no data", () => {
    const { container } = render(
      <ByeWeekDashboard data={null} isLoading={false} isError={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders total games stat", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Total Games").length > 0).toBeTruthy();
    expect(screen.queryAllByText("512").length > 0).toBeTruthy();
  });

  it("renders on bye win percentage", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("On Bye Win %").length > 0).toBeTruthy();
    expect(screen.queryAllByText("0.509").length > 0).toBeTruthy();
  });

  it("renders not on bye win percentage", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Not Bye Win %").length > 0).toBeTruthy();
    expect(screen.queryAllByText("0.489").length > 0).toBeTruthy();
  });

  it("renders opponent on bye win percentage", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Opp On Bye Win %").length > 0).toBeTruthy();
    expect(screen.queryAllByText("0.517").length > 0).toBeTruthy();
  });

  it("renders coming off bye section", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Coming Off Bye").length > 0).toBeTruthy();
  });

  it("renders not on bye section", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Not Coming Off Bye").length > 0).toBeTruthy();
  });

  it("renders opponent on bye section", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Playing Against Team on Bye").length > 0).toBeTruthy();
  });

  it("renders scoring differential", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Scoring Differential").length > 0).toBeTruthy();
    expect(screen.queryAllByText("1.2").length > 0).toBeTruthy();
    expect(screen.queryAllByText("-0.8").length > 0).toBeTruthy();
  });

  it("renders cover rates", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.getAllByText("Cover Rate").length).toBeGreaterThan(0);
  });

  it("renders season trends table", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("Season-by-Season Bye Week Trends").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2024").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
  });

  it("renders win/loss/tie counts for on bye teams", () => {
    render(
      <ByeWeekDashboard data={mockData} isLoading={false} isError={false} />
    );
    expect(screen.queryAllByText("145").length > 0).toBeTruthy(); // on bye wins
  });
});
