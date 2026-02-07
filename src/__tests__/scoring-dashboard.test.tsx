import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import ScoringDashboard from "@/components/scoring-dashboard";
import type { ScoringDistributionResult } from "@/lib/scoring-distribution";

afterEach(cleanup);

const mockAnalysis: ScoringDistributionResult = {
  totalGames: 100,
  overallAvgTotal: "45.5",
  scoreDistribution: [
    { label: "0-20", min: 0, max: 20, count: 10, percentage: "10.0" },
    { label: "21-30", min: 21, max: 30, count: 20, percentage: "20.0" },
    { label: "31-40", min: 31, max: 40, count: 25, percentage: "25.0" },
    { label: "41-50", min: 41, max: 50, count: 25, percentage: "25.0" },
    { label: "51-60", min: 51, max: 60, count: 15, percentage: "15.0" },
    { label: "61+", min: 61, max: 1000, count: 5, percentage: "5.0" },
  ],
  marginDistribution: [
    { label: "0 (Tie)", min: 0, max: 0, count: 2, percentage: "2.0" },
    { label: "1-3", min: 1, max: 3, count: 30, percentage: "30.0" },
    { label: "4-7", min: 4, max: 7, count: 28, percentage: "28.0" },
    { label: "8-14", min: 8, max: 14, count: 20, percentage: "20.0" },
    { label: "15-21", min: 15, max: 21, count: 15, percentage: "15.0" },
    { label: "22+", min: 22, max: 1000, count: 5, percentage: "5.0" },
  ],
  byEra: [
    {
      era: "2020s",
      decade: 2020,
      games: 40,
      avgTotal: "46.2",
      avgHome: "23.1",
      avgAway: "23.1",
      highestGame: 62,
      lowestGame: 18,
    },
    {
      era: "2010s",
      decade: 2010,
      games: 60,
      avgTotal: "45.0",
      avgHome: "22.5",
      avgAway: "22.5",
      highestGame: 61,
      lowestGame: 17,
    },
  ],
  byDayOfWeek: [
    { day: "Sunday", games: 60, avgTotal: "45.8", avgHome: "23.1", avgAway: "22.7" },
    { day: "Monday", games: 20, avgTotal: "44.2", avgHome: "22.1", avgAway: "22.1" },
    { day: "Thursday", games: 20, avgTotal: "46.0", avgHome: "23.0", avgAway: "23.0" },
  ],
  primetimeComparison: {
    primetime: {
      label: "Primetime",
      games: 50,
      avgTotal: "46.5",
      avgHome: "23.3",
      avgAway: "23.2",
    },
    regular: {
      label: "Regular",
      games: 50,
      avgTotal: "44.5",
      avgHome: "22.3",
      avgAway: "22.2",
    },
  },
};

describe("ScoringDashboard", () => {
  it("renders loading state", () => {
    render(
      <ScoringDashboard
        analysis={null}
        isLoading={true}
        isError={false}
      />
    );
    expect(screen.getByText("Loading scoring analysis...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <ScoringDashboard
        analysis={null}
        isLoading={false}
        isError={true}
      />
    );
    expect(screen.getByText("Failed to load scoring analysis.")).toBeInTheDocument();
  });

  it("returns null when no analysis provided", () => {
    const { container } = render(
      <ScoringDashboard
        analysis={null}
        isLoading={false}
        isError={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders overview stat boxes", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Total Games")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    // Check for both the stat box label and value for Avg Total
    const allElements = screen.getAllByText("Avg Total");
    expect(allElements.length).toBeGreaterThan(0);
    expect(screen.getByText("45.5")).toBeInTheDocument();
  });

  it("renders score distribution section", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Score Distribution")).toBeInTheDocument();
    expect(screen.getByText("0-20")).toBeInTheDocument();
    expect(screen.getByText("21-30")).toBeInTheDocument();
  });

  it("renders margin distribution section", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Margin of Victory Distribution")).toBeInTheDocument();
  });

  it("renders era comparison section", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Scoring by Era")).toBeInTheDocument();
    expect(screen.getByText("2020s")).toBeInTheDocument();
    expect(screen.getByText("2010s")).toBeInTheDocument();
  });

  it("renders day of week section", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Scoring by Day of Week")).toBeInTheDocument();
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
  });

  it("renders primetime comparison section", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Primetime vs Regular Season")).toBeInTheDocument();
    expect(screen.getByText("Primetime")).toBeInTheDocument();
    expect(screen.getByText("Regular Season")).toBeInTheDocument();
  });

  it("displays primetime game count", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Primetime Games")).toBeInTheDocument();
    // The "50" is the primetime game count
    const fifties = screen.getAllByText("50");
    expect(fifties.length).toBeGreaterThan(0);
  });

  it("renders era statistics correctly", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("46.2")).toBeInTheDocument(); // 2020s avgTotal
    expect(screen.getByText("40")).toBeInTheDocument(); // 2020s games
  });

  it("renders day of week statistics", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("45.8")).toBeInTheDocument(); // Sunday avgTotal
    // Check for "60" which appears for Sunday games
    const sixties = screen.getAllByText("60");
    expect(sixties.length).toBeGreaterThan(0);
  });

  it("renders primetime vs regular comparison data", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("46.5")).toBeInTheDocument(); // Primetime avgTotal
    expect(screen.getByText("44.5")).toBeInTheDocument(); // Regular avgTotal
  });

  it("shows distribution percentages", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    // Check that percentages are displayed
    const percentages = screen.queryAllByText(/\d+\.\d+%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it("displays margin distribution counts", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    // Margin distribution should show counts
    expect(screen.getByText("30")).toBeInTheDocument(); // 1-3 margin count
    expect(screen.getByText("28")).toBeInTheDocument(); // 4-7 margin count
  });

  it("renders all era labels", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("2020s")).toBeInTheDocument();
    expect(screen.getByText("2010s")).toBeInTheDocument();
  });

  it("renders all day labels", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Thursday")).toBeInTheDocument();
  });

  it("displays home and away averages", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    // Check for averages - there should be multiple with these values
    const allTexts = screen.getAllByText(/23\.1/);
    expect(allTexts.length).toBeGreaterThan(0);
  });

  it("renders score range description", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Most Common Range")).toBeInTheDocument();
  });

  it("renders average margin statistic", () => {
    render(
      <ScoringDashboard
        analysis={mockAnalysis}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Avg Margin")).toBeInTheDocument();
  });
});
