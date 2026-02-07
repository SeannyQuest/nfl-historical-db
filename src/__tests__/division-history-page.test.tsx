import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DivisionHistoryPage from "@/app/division-history/page";

vi.mock("@/hooks/use-games", () => ({
  useDivisionHistory: vi.fn(() => ({
    data: {
      data: {
        divisionWinners: [],
        divisionDominance: [],
        intraDivisionRecords: [],
        divisionStrengthByYear: [],
        mostCompetitiveDivisions: [],
      },
    },
    isLoading: false,
    isError: false,
  })),
}));

describe("DivisionHistoryPage", () => {
  it("renders page title", () => {
    render(<DivisionHistoryPage />);
    expect(screen.getByText("Division History & Dominance")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<DivisionHistoryPage />);
    expect(screen.getAllByText(/Track division winners by season/).length).toBeGreaterThan(0);
  });
});
