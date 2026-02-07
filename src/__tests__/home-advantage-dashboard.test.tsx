import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HomeAdvantageDashboard from "@/components/home-advantage-dashboard";
import type { HomeAdvantageResult } from "@/lib/home-advantage";

const mockData: HomeAdvantageResult = {
  overallHomeWinRate: "0.575",
  homeWinRateBySeasonTrend: [
    { season: 2024, homeWinPct: "0.580" },
    { season: 2023, homeWinPct: "0.570" },
  ],
  homeWinRateByDayOfWeek: [
    { day: "Sunday", games: 100, homeWinPct: "0.580" },
    { day: "Monday", games: 20, homeWinPct: "0.550" },
  ],
  homeWinRateByPrimetime: [
    { slot: "SNF", games: 15, homeWinPct: "0.600" },
    { slot: "MNF", games: 17, homeWinPct: "0.560" },
  ],
  playoffVsRegularHomeWinRate: {
    regular: "0.570",
    playoff: "0.600",
  },
  homeScoringAdvantage: "2.5",
  homeCoverRate: "0.520",
  bestHomeTeams: [
    { team: "Kansas City Chiefs", homeWins: 45, homeLosses: 12, homeWinPct: "79.0%" },
    { team: "New England Patriots", homeWins: 48, homeLosses: 18, homeWinPct: "72.7%" },
  ],
  worstHomeTeams: [
    { team: "Detroit Lions", homeWins: 18, homeLosses: 32, homeWinPct: "36.0%" },
    { team: "Jacksonville Jaguars", homeWins: 20, homeLosses: 31, homeWinPct: "39.2%" },
  ],
  domeVsOutdoorAdvantage: {
    dome: "60.0%",
    outdoor: "55.0%",
  },
};

describe("HomeAdvantageDashboard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    render(<HomeAdvantageDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading home advantage data...")).toBeTruthy();
  });

  it("renders error state", () => {
    render(<HomeAdvantageDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load home advantage data.")).toBeTruthy();
  });

  it("renders null when no data", () => {
    const { container } = render(<HomeAdvantageDashboard data={null} isLoading={false} isError={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays overall home win percentage", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const rates = screen.getAllByText("57.5%");
    expect(rates.length).toBeGreaterThan(0);
  });

  it("displays home cover percentage", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const rates = screen.getAllByText("52.0%");
    expect(rates.length).toBeGreaterThan(0);
  });

  it("displays scoring advantage", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const scores = screen.getAllByText("2.5");
    expect(scores.length).toBeGreaterThan(0);
  });

  it("displays regular season home win rate", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const regularRows = screen.getAllByText(/Regular Season/);
    expect(regularRows.length).toBeGreaterThan(0);
  });

  it("displays playoff home win rate", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const playoffRows = screen.getAllByText(/Playoff/);
    expect(playoffRows.length).toBeGreaterThan(0);
  });

  it("displays dome advantage", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Dome Home Advantage");
    expect(titles.length).toBeGreaterThan(0);
  });

  it("displays outdoor advantage", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Outdoor Home Advantage");
    expect(titles.length).toBeGreaterThan(0);
  });

  it("displays day of week breakdown", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Home Advantage by Day of Week");
    const days = screen.getAllByText("Sunday");
    expect(titles.length).toBeGreaterThan(0);
    expect(days.length).toBeGreaterThan(0);
  });

  it("displays primetime breakdown", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Home Advantage by Primetime Slot");
    const slots = screen.getAllByText("SNF");
    expect(titles.length).toBeGreaterThan(0);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("displays season trend table", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Home Win % by Season");
    const years = screen.getAllByText("2024");
    expect(titles.length).toBeGreaterThan(0);
    expect(years.length).toBeGreaterThan(0);
  });

  it("displays best home teams table", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Best Home Teams");
    const chiefs = screen.getAllByText("Kansas City Chiefs");
    expect(titles.length).toBeGreaterThan(0);
    expect(chiefs.length).toBeGreaterThan(0);
  });

  it("displays worst home teams table", () => {
    render(<HomeAdvantageDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Worst Home Teams");
    const lions = screen.getAllByText("Detroit Lions");
    expect(titles.length).toBeGreaterThan(0);
    expect(lions.length).toBeGreaterThan(0);
  });

  it("handles empty dome/outdoor data", () => {
    const noConditionsData: HomeAdvantageResult = {
      ...mockData,
      domeVsOutdoorAdvantage: { dome: null, outdoor: null },
    };
    render(<HomeAdvantageDashboard data={noConditionsData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Dome Home Advantage");
    expect(results.length).toBe(0);
  });

  it("handles empty season trends", () => {
    const noTrendsData: HomeAdvantageResult = {
      ...mockData,
      homeWinRateBySeasonTrend: [],
    };
    render(<HomeAdvantageDashboard data={noTrendsData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Home Win % by Season");
    expect(results.length).toBe(0);
  });

  it("handles empty day of week breakdown", () => {
    const noDayData: HomeAdvantageResult = {
      ...mockData,
      homeWinRateByDayOfWeek: [],
    };
    render(<HomeAdvantageDashboard data={noDayData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Home Advantage by Day of Week");
    expect(results.length).toBe(0);
  });

  it("handles empty primetime breakdown", () => {
    const noPrimetimeData: HomeAdvantageResult = {
      ...mockData,
      homeWinRateByPrimetime: [],
    };
    render(<HomeAdvantageDashboard data={noPrimetimeData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Home Advantage by Primetime Slot");
    expect(results.length).toBe(0);
  });

  it("handles empty best home teams", () => {
    const noBestTeamsData: HomeAdvantageResult = {
      ...mockData,
      bestHomeTeams: [],
    };
    render(<HomeAdvantageDashboard data={noBestTeamsData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Best Home Teams");
    expect(results.length).toBe(0);
  });

  it("handles empty worst home teams", () => {
    const noWorstTeamsData: HomeAdvantageResult = {
      ...mockData,
      worstHomeTeams: [],
    };
    render(<HomeAdvantageDashboard data={noWorstTeamsData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Worst Home Teams");
    expect(results.length).toBe(0);
  });
});
