import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FranchiseHistoryPage from "@/app/franchise-history/page";

vi.mock("@/hooks/use-games", () => ({
  useFranchiseHistory: () => ({
    data: {
      data: {
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
            bestSeason: { season: 2013, wins: 13, losses: 3, ties: 0 },
            worstSeason: { season: 1991, wins: 4, losses: 12, ties: 0 },
            superBowlWins: 3,
            superBowlAppearances: 4,
          },
        ],
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/components/franchise-history-dashboard", () => ({
  default: () => <div>Franchise History Dashboard</div>,
}));

describe("FranchiseHistoryPage", () => {
  it("renders page title", () => {
    render(<FranchiseHistoryPage />);
    expect(screen.getByText("Franchise History")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<FranchiseHistoryPage />);
    expect(screen.getAllByText(/Complete timeline and cumulative records/i).length).toBeGreaterThan(0);
  });

  it("renders dashboard component", () => {
    render(<FranchiseHistoryPage />);
    expect(screen.getAllByText("Franchise History Dashboard").length).toBeGreaterThan(0);
  });
});
