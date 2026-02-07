import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ErasPage from "@/app/eras/page";

vi.mock("@/hooks/use-games", () => ({
  useEraComparison: vi.fn(() => ({
    data: {
      data: {
        eras: [
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
        notableRecords: [],
      },
    },
    isLoading: false,
    isError: false,
  })),
}));

describe("ErasPage", () => {
  it("renders page title", () => {
    render(<ErasPage />);
    expect(screen.getByText("NFL Era Comparison")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<ErasPage />);
    expect(screen.getAllByText(/Comprehensive analysis of NFL eras/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pre-Merger/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Modern Era/).length).toBeGreaterThan(0);
  });

  it("renders dashboard component", () => {
    render(<ErasPage />);
    expect(screen.getAllByText("Highest Scoring").length).toBeGreaterThan(0);
  });
});
