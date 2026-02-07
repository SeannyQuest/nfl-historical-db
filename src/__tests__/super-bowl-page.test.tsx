import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SuperBowlPage from "@/app/super-bowl/page";

vi.mock("@/hooks/use-games", () => ({
  useSuperBowlStats: () => ({
    data: {
      data: {
        stats: {
          totalSuperBowls: 58,
          championsByYear: [],
          biggestBlowouts: [],
          closestGames: [],
          mostAppearances: [],
          dynastyTracker: [],
        },
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/components/super-bowl-dashboard", () => ({
  default: () => <div>Super Bowl Dashboard</div>,
}));

describe("SuperBowlPage", () => {
  it("renders page title", () => {
    render(<SuperBowlPage />);
    expect(screen.getByText("Super Bowl History")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<SuperBowlPage />);
    expect(screen.getAllByText(/Comprehensive Super Bowl statistics/i).length).toBeGreaterThan(0);
  });

  it("renders dashboard component", () => {
    render(<SuperBowlPage />);
    expect(screen.getAllByText("Super Bowl Dashboard").length).toBeGreaterThan(0);
  });
});
