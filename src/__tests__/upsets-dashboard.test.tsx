import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import UpsettsDashboard from "@/components/upsets-dashboard";
import type { UpsetsResult } from "@/lib/upsets";

const mockData: UpsetsResult = {
  biggestUpsets: [
    {
      season: 2024,
      week: "1",
      date: "2024-01-01T12:00:00.000Z",
      isPlayoff: false,
      underdogTeam: "Buffalo Bills",
      favoriteTeam: "Kansas City Chiefs",
      score: "24-20",
      spread: 3.5,
      spreadMarginOfVictory: 0.5,
    },
  ],
  upsetRateBySeasonTrend: [
    { season: 2024, upsetPct: "0.320" },
    { season: 2023, upsetPct: "0.315" },
  ],
  upsetRateBySpreadRange: [
    { range: "3-7pt", games: 50, upsets: 17, upsetPct: "0.340" },
    { range: "7-10pt", games: 40, upsets: 11, upsetPct: "0.275" },
  ],
  upsetRateByPrimetime: [
    { slot: "SNF", games: 20, upsets: 7, upsetPct: "0.350" },
  ],
  upsetRateByPlayoffRound: [
    { round: "WildCard", games: 16, upsets: 4, upsetPct: "0.250" },
  ],
  mostCommonUpsettingTeams: [
    { team: "Buffalo Bills", upsetWins: 8, totalWins: 30, upsetWinPct: "26.7%" },
    { team: "Detroit Lions", upsetWins: 6, totalWins: 25, upsetWinPct: "24.0%" },
  ],
  longestUpsetsWinStreaks: [
    {
      team: "Buffalo Bills",
      streakLength: 8,
      startDate: "2024-01-01T12:00:00.000Z",
      endDate: "2024-12-31T12:00:00.000Z",
    },
  ],
  overallUpsetRate: "0.320",
};

describe("UpsettsDashboard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders loading state", () => {
    render(<UpsettsDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading upsets data...")).toBeTruthy();
  });

  it("renders error state", () => {
    render(<UpsettsDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load upsets data.")).toBeTruthy();
  });

  it("renders null when no data", () => {
    const { container } = render(<UpsettsDashboard data={null} isLoading={false} isError={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays overall upset rate", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const rates = screen.getAllByText("32.0%");
    expect(rates.length).toBeGreaterThan(0);
  });

  it("displays biggest upsets table", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Biggest Upsets (by Margin vs Spread)");
    const teams = screen.getAllByText("Buffalo Bills");
    expect(titles.length).toBeGreaterThan(0);
    expect(teams.length).toBeGreaterThan(0);
  });

  it("displays upset rate by spread range", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Upset Rate by Spread Range");
    const ranges = screen.getAllByText("3-7pt");
    expect(titles.length).toBeGreaterThan(0);
    expect(ranges.length).toBeGreaterThan(0);
  });

  it("displays upset rate by primetime slot", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Upset Rate by Primetime Slot");
    const slots = screen.getAllByText("SNF");
    expect(titles.length).toBeGreaterThan(0);
    expect(slots.length).toBeGreaterThan(0);
  });

  it("displays upset rate by playoff round", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Upset Rate by Playoff Round");
    const rounds = screen.getAllByText("WildCard");
    expect(titles.length).toBeGreaterThan(0);
    expect(rounds.length).toBeGreaterThan(0);
  });

  it("displays most common upsetting teams", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Most Common Upsetting Teams");
    const teams = screen.getAllByText("Buffalo Bills");
    expect(titles.length).toBeGreaterThan(0);
    expect(teams.length).toBeGreaterThan(0);
  });

  it("displays longest upset win streaks", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Most Upset Wins (Active)");
    expect(titles.length).toBeGreaterThan(0);
  });

  it("displays upset rate by season", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const titles = screen.getAllByText("Upset Rate by Season");
    const years = screen.getAllByText("2024");
    expect(titles.length).toBeGreaterThan(0);
    expect(years.length).toBeGreaterThan(0);
  });

  it("handles empty biggest upsets", () => {
    const noUpsetsData: UpsetsResult = {
      ...mockData,
      biggestUpsets: [],
    };
    render(<UpsettsDashboard data={noUpsetsData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Biggest Upsets (by Margin vs Spread)");
    expect(results.length).toBe(0);
  });

  it("handles empty spread range data", () => {
    const noSpreadData: UpsetsResult = {
      ...mockData,
      upsetRateBySpreadRange: [],
    };
    render(<UpsettsDashboard data={noSpreadData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Upset Rate by Spread Range");
    expect(results.length).toBe(0);
  });

  it("handles empty primetime data", () => {
    const noPrimetimeData: UpsetsResult = {
      ...mockData,
      upsetRateByPrimetime: [],
    };
    render(<UpsettsDashboard data={noPrimetimeData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Upset Rate by Primetime Slot");
    expect(results.length).toBe(0);
  });

  it("handles empty playoff data", () => {
    const noPlayoffData: UpsetsResult = {
      ...mockData,
      upsetRateByPlayoffRound: [],
    };
    render(<UpsettsDashboard data={noPlayoffData} isLoading={false} isError={false} />);
    const results = screen.queryAllByText("Upset Rate by Playoff Round");
    expect(results.length).toBe(0);
  });

  it("calculates percentages correctly", () => {
    render(<UpsettsDashboard data={mockData} isLoading={false} isError={false} />);
    const percentages = screen.getAllByText(/\d+\.\d+%/);
    expect(percentages.length).toBeGreaterThan(0);
  });
});
