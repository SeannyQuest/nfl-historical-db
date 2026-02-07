import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ByeWeekPage from "@/app/bye-week/page";

vi.mock("@/hooks/use-games", () => ({
  useByeWeekImpact: () => ({
    data: {
      data: {
        stats: {
          totalGames: 512,
          recordOnBye: { wins: 145, losses: 140, ties: 2, winPct: "0.509" },
          recordNotOnBye: { wins: 110, losses: 115, ties: 0, winPct: "0.489" },
          coverRateOnBye: "0.510",
          coverRateNotOnBye: "0.495",
          scoringDifferentialOnBye: "1.2",
          scoringDifferentialNotOnBye: "-0.8",
          byeWeekTrends: [],
          opponentOnByeStats: { wins: 155, losses: 145, ties: 1, winPct: "0.517" },
        },
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/components/bye-week-dashboard", () => ({
  default: () => <div>Bye Week Dashboard</div>,
}));

describe("ByeWeekPage", () => {
  it("renders page title", () => {
    render(<ByeWeekPage />);
    expect(screen.getByText("Bye Week Impact")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<ByeWeekPage />);
    expect(screen.getAllByText(/Analysis of team performance coming off bye weeks/i).length).toBeGreaterThan(0);
  });

  it("renders dashboard component", () => {
    render(<ByeWeekPage />);
    expect(screen.getAllByText("Bye Week Dashboard").length).toBeGreaterThan(0);
  });
});
