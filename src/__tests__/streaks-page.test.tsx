import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StreaksPage from "@/app/streaks/page";

vi.mock("@/hooks/use-games", () => ({
  useStreaks: vi.fn(() => ({
    data: {
      data: {
        currentStreaks: [],
        longestWinningStreaks: [],
        longestLosingStreaks: [],
        longestHomeWinStreaks: [],
        longestAwayWinStreaks: [],
        longestATSStreaks: [],
        longestOverStreaks: [],
      },
    },
    isLoading: false,
    isError: false,
  })),
}));

describe("StreaksPage", () => {
  it("renders page title", () => {
    render(<StreaksPage />);
    expect(screen.getByText("Streak & Momentum Tracker")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<StreaksPage />);
    expect(screen.getAllByText(/Track current and all-time winning/).length).toBeGreaterThan(0);
  });
});
