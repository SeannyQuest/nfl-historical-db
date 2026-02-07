import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrimetimeDashboard from "@/components/primetime-dashboard";
import type { PrimetimeStatsResult } from "@/lib/primetime-stats";

const mockData: PrimetimeStatsResult = {
  slots: [
    {
      slot: "SNF",
      totalGames: 300,
      avgHomeScore: "22.5",
      avgAwayScore: "21.0",
      homeWinPct: "0.560",
      homeWins: 168,
      awayWins: 132,
      upsetRate: "0.150",
      homeCoverPct: "0.520",
      overPct: "0.530",
    },
  ],
  bestPrimetimeTeam: { teamName: "Kansas City Chiefs", slot: "SNF", winPct: "0.650", games: 20 },
  worstPrimetimeTeam: { teamName: "Detroit Lions", slot: "MNF", winPct: "0.350", games: 20 },
  primetimeVsNonPrimetime: {
    primetime: { avgTotal: "44.5", homeWinPct: "0.560", avgSpread: "3.0" },
    nonPrimetime: { avgTotal: "42.0", homeWinPct: "0.540", avgSpread: "2.8" },
  },
  biggestBlowouts: [
    { score: "49-20", margin: 29, teams: "LAR @ KC", slot: "SNF" },
    { score: "52-21", margin: 31, teams: "KC @ TB", slot: "MNF" },
  ],
  upsets: [
    { teams: "DET @ KC", score: "24-21", slot: "SNF", season: 2023 },
    { teams: "GB @ DAL", score: "31-26", slot: "TNF", season: 2023 },
  ],
};

describe("PrimetimeDashboard", () => {
  it("renders loading state", () => {
    render(<PrimetimeDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.queryByText("Loading primetime stats...") ?? screen.getAllByText("Loading primetime stats...").length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(<PrimetimeDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.queryByText("Failed to load primetime stats.") ?? screen.getAllByText("Failed to load primetime stats.").length > 0).toBeTruthy();
  });

  it("renders dashboard with data", () => {
    render(<PrimetimeDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("SNF").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
  });

  it("displays stat boxes", () => {
    render(<PrimetimeDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Total Slots").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Best Team").length > 0).toBeTruthy();
  });

  it("shows primetime vs non-primetime comparison", () => {
    render(<PrimetimeDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("44.5").length > 0).toBeTruthy();
    expect(screen.queryAllByText("42.0").length > 0).toBeTruthy();
  });

  it("displays biggest blowouts", () => {
    render(<PrimetimeDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Biggest Primetime Blowouts").length > 0).toBeTruthy();
  });

  it("displays upsets", () => {
    render(<PrimetimeDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Primetime Upsets").length > 0).toBeTruthy();
    expect(screen.queryAllByText("DET @ KC (2023)").length > 0).toBeTruthy();
  });

  it("handles empty data", () => {
    const emptyData: PrimetimeStatsResult = {
      slots: [],
      bestPrimetimeTeam: null,
      worstPrimetimeTeam: null,
      primetimeVsNonPrimetime: {
        primetime: { avgTotal: "0.0", homeWinPct: ".000", avgSpread: "0.0" },
        nonPrimetime: { avgTotal: "0.0", homeWinPct: ".000", avgSpread: "0.0" },
      },
      biggestBlowouts: [],
      upsets: [],
    };
    render(<PrimetimeDashboard data={emptyData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Total Slots").length > 0).toBeTruthy();
  });

  it("handles null data", () => {
    const { container } = render(<PrimetimeDashboard data={null} isLoading={false} isError={false} />);
    expect(container.firstChild).toBeNull();
  });
});
