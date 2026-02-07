import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EraComparisonDashboard from "@/components/era-comparison-dashboard";
import type { EraComparisonResult } from "@/lib/era-comparison";

const mockEraData: EraComparisonResult = {
  eras: [
    {
      era: "Pre-Merger",
      years: "1966-1969",
      totalGames: 280,
      avgScoringTotal: "40.2",
      avgHomeScore: "20.8",
      avgAwayScore: "19.4",
      homeWinPct: "0.545",
      overPct: "0.420",
      avgSpread: "2.5",
      homeCoverPct: "0.510",
    },
    {
      era: "Early Modern",
      years: "1970-1989",
      totalGames: 5120,
      avgScoringTotal: "41.8",
      avgHomeScore: "21.5",
      avgAwayScore: "20.3",
      homeWinPct: "0.560",
      overPct: "0.480",
      avgSpread: "3.0",
      homeCoverPct: "0.520",
    },
    {
      era: "Salary Cap Era",
      years: "1994-2009",
      totalGames: 4096,
      avgScoringTotal: "42.5",
      avgHomeScore: "22.1",
      avgAwayScore: "20.4",
      homeWinPct: "0.570",
      overPct: "0.520",
      avgSpread: "3.2",
      homeCoverPct: "0.530",
    },
    {
      era: "Modern Era",
      years: "2010+",
      totalGames: 3584,
      avgScoringTotal: "45.3",
      avgHomeScore: "23.4",
      avgAwayScore: "21.9",
      homeWinPct: "0.580",
      overPct: "0.560",
      avgSpread: "2.8",
      homeCoverPct: "0.540",
    },
  ],
  highestScoringEra: { era: "Modern Era", avg: "45.3" },
  lowestScoringEra: { era: "Pre-Merger", avg: "40.2" },
  highestHomeWinRateEra: { era: "Modern Era", pct: "0.580" },
  notableRecords: [
    {
      season: 2023,
      team: "Kansas City Chiefs",
      stat: "14-3 (0.824)",
      value: 14,
    },
    {
      season: 2022,
      team: "Buffalo Bills",
      stat: "13-4 (0.765)",
      value: 13,
    },
    {
      season: 2021,
      team: "Tampa Bay Buccaneers",
      stat: "13-4 (0.765)",
      value: 13,
    },
    {
      season: 2020,
      team: "Kansas City Chiefs",
      stat: "14-2 (0.875)",
      value: 14,
    },
    {
      season: 2019,
      team: "Baltimore Ravens",
      stat: "14-2 (0.875)",
      value: 14,
    },
  ],
};

describe("EraComparisonDashboard", () => {
  describe("loading state", () => {
    it("shows loading message when loading", () => {
      render(<EraComparisonDashboard data={null} isLoading={true} isError={false} />);
      expect(screen.queryAllByText("Loading era comparison data...").length > 0).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message when error", () => {
      render(<EraComparisonDashboard data={null} isLoading={false} isError={true} />);
      expect(screen.queryAllByText("Failed to load era comparison data.").length > 0).toBeTruthy();
    });
  });

  describe("rendering data", () => {
    it("renders dashboard with era data", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("Pre-Merger").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Modern Era").length > 0).toBeTruthy();
    });

    it("displays stat boxes", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("Highest Scoring").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Lowest Scoring").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Highest Home W%").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Total Eras").length > 0).toBeTruthy();
    });

    it("displays era breakdown table", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("Era Breakdown").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Years").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Games").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Avg Total").length > 0).toBeTruthy();
    });

    it("displays best team seasons table", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.getByText("Best Team Seasons (Win %)")).toBeInTheDocument();
      expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
      expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
    });
  });

  describe("era data display", () => {
    it("shows correct era years", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("1966-1969").length > 0).toBeTruthy();
      expect(screen.queryAllByText("1970-1989").length > 0).toBeTruthy();
      expect(screen.queryAllByText("1994-2009").length > 0).toBeTruthy();
      expect(screen.queryAllByText("2010+").length > 0).toBeTruthy();
    });

    it("displays game counts", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("280").length > 0).toBeTruthy();
      expect(screen.queryAllByText("5120").length > 0).toBeTruthy();
    });

    it("displays scoring averages", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("40.2").length > 0).toBeTruthy();
      expect(screen.queryAllByText("45.3").length > 0).toBeTruthy();
    });

    it("displays home win percentages", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("54.5%").length > 0).toBeTruthy();
      expect(screen.queryAllByText("58.0%").length > 0).toBeTruthy();
    });
  });

  describe("notable records display", () => {
    it("shows record rankings", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("#1").length > 0).toBeTruthy();
      expect(screen.queryAllByText("#5").length > 0).toBeTruthy();
    });

    it("shows team names in records", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Buffalo Bills").length > 0).toBeTruthy();
    });

    it("shows seasons for records", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
      expect(screen.queryAllByText("2022").length > 0).toBeTruthy();
    });

    it("shows record statistics", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("14-3 (0.824)").length > 0).toBeTruthy();
      expect(screen.queryAllByText("13-4 (0.765)").length > 0).toBeTruthy();
    });
  });

  describe("comparisons", () => {
    it("shows highest scoring era", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("45.3 ppg").length > 0).toBeTruthy();
    });

    it("shows lowest scoring era", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("40.2 ppg").length > 0).toBeTruthy();
    });

    it("shows highest home win rate era", () => {
      render(<EraComparisonDashboard data={mockEraData} isLoading={false} isError={false} />);
      expect(screen.queryAllByText("58.0%").length > 0).toBeTruthy();
    });
  });

  describe("empty states", () => {
    it("returns null when data is null", () => {
      const { container } = render(<EraComparisonDashboard data={null} isLoading={false} isError={false} />);
      expect(container.firstChild).toBeNull();
    });

    it("handles empty eras array", () => {
      const emptyData = { ...mockEraData, eras: [] };
      render(<EraComparisonDashboard data={emptyData} isLoading={false} isError={false} />);
      expect(screen.queryByText("Era Breakdown")).not.toBeInTheDocument();
    });

    it("handles empty notable records", () => {
      const emptyData = { ...mockEraData, notableRecords: [] };
      render(<EraComparisonDashboard data={emptyData} isLoading={false} isError={false} />);
      expect(screen.queryByText("Best Team Seasons (Win %)")).not.toBeInTheDocument();
    });
  });
});
