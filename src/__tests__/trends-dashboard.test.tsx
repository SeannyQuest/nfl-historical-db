import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import TrendsDashboard from "@/components/trends-dashboard";
import type { TrendsResult } from "@/lib/trends";

afterEach(cleanup);

const sampleTrends: TrendsResult = {
  totalGames: 500,
  totalSeasons: 5,
  overallAvgTotal: "45.2",
  overallHomeWinPct: "0.571",
  overallOverPct: "0.498",
  highestScoringGame: { season: 2024, total: 105 },
  lowestScoringGame: { season: 2020, total: 6 },
  seasons: [
    {
      season: 2024,
      totalGames: 100,
      avgTotal: "46.8",
      avgHomeScore: "24.1",
      avgAwayScore: "22.7",
      homeWins: 55,
      awayWins: 44,
      ties: 1,
      homeWinPct: "0.556",
      overs: 48,
      unders: 45,
      ouPushes: 3,
      overPct: "0.500",
      homeCovered: 44,
      homeSpreadLost: 46,
      spreadPushes: 5,
      homeCoverPct: "0.463",
    },
    {
      season: 2023,
      totalGames: 100,
      avgTotal: "44.5",
      avgHomeScore: "23.0",
      avgAwayScore: "21.5",
      homeWins: 58,
      awayWins: 42,
      ties: 0,
      homeWinPct: "0.580",
      overs: 52,
      unders: 42,
      ouPushes: 2,
      overPct: "0.542",
      homeCovered: 50,
      homeSpreadLost: 43,
      spreadPushes: 3,
      homeCoverPct: "0.521",
    },
  ],
  primetime: [
    {
      slot: "SNF",
      totalGames: 40,
      avgTotal: "47.3",
      homeWinPct: "0.600",
      overPct: "0.525",
    },
    {
      slot: "MNF",
      totalGames: 35,
      avgTotal: "43.1",
      homeWinPct: "0.543",
      overPct: "0.457",
    },
  ],
  playoffVsRegular: {
    regular: { avgTotal: "44.8", homeWinPct: "0.565" },
    playoff: { avgTotal: "41.2", homeWinPct: "0.583" },
  },
};

describe("TrendsDashboard", () => {
  it("shows loading state", () => {
    render(<TrendsDashboard trends={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading trends data...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<TrendsDashboard trends={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load trends data.")).toBeInTheDocument();
  });

  it("renders nothing when no trends and not loading/error", () => {
    const { container } = render(<TrendsDashboard trends={null} isLoading={false} isError={false} />);
    expect(container.innerHTML).toBe("");
  });

  // Overview stat boxes
  it("renders total games count", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("renders total seasons count", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("5 seasons")).toBeInTheDocument();
  });

  it("renders overall avg total", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("45.2")).toBeInTheDocument();
  });

  it("renders home win pct", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("0.571")).toBeInTheDocument();
  });

  it("renders over pct", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("0.498")).toBeInTheDocument();
  });

  it("renders scoring range", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText(/6.*105/)).toBeInTheDocument();
  });

  // Playoff vs Regular
  it("renders regular season panel", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("Regular Season")).toBeInTheDocument();
    expect(screen.getByText("44.8")).toBeInTheDocument();
  });

  it("renders playoff panel", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("Playoffs")).toBeInTheDocument();
    expect(screen.getByText("41.2")).toBeInTheDocument();
  });

  it("renders regular home win pct", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("0.565")).toBeInTheDocument();
  });

  it("renders playoff home win pct", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("0.583")).toBeInTheDocument();
  });

  // Primetime table
  it("renders primetime breakdown header", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("Primetime Breakdown")).toBeInTheDocument();
  });

  it("renders primetime slots", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("SNF")).toBeInTheDocument();
    expect(screen.getByText("MNF")).toBeInTheDocument();
  });

  it("renders primetime game counts", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
  });

  it("renders primetime avg totals", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("47.3")).toBeInTheDocument();
    expect(screen.getByText("43.1")).toBeInTheDocument();
  });

  // Season table
  it("renders season-by-season header", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("Season-by-Season")).toBeInTheDocument();
  });

  it("renders season years", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("renders season game counts", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getAllByText("100")).toHaveLength(2);
  });

  it("renders season avg totals", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("46.8")).toBeInTheDocument();
    expect(screen.getByText("44.5")).toBeInTheDocument();
  });

  it("renders season home-away-tie records", () => {
    render(<TrendsDashboard trends={sampleTrends} isLoading={false} isError={false} />);
    expect(screen.getByText("55-44-1")).toBeInTheDocument();
    expect(screen.getByText("58-42-0")).toBeInTheDocument();
  });

  it("hides primetime section when empty", () => {
    const noPrimetime = { ...sampleTrends, primetime: [] };
    render(<TrendsDashboard trends={noPrimetime} isLoading={false} isError={false} />);
    expect(screen.queryByText("Primetime Breakdown")).not.toBeInTheDocument();
  });

  it("hides season section when empty", () => {
    const noSeasons = { ...sampleTrends, seasons: [] };
    render(<TrendsDashboard trends={noSeasons} isLoading={false} isError={false} />);
    expect(screen.queryByText("Season-by-Season")).not.toBeInTheDocument();
  });
});
