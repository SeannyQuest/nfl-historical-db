import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ConferenceComparisonPage from "@/app/conference-comparison/page";

vi.mock("@/hooks/use-games", () => ({
  useConferenceComparison: () => ({
    data: {
      data: {
        afcStats: {
          totalWins: 312,
          totalLosses: 288,
          totalTies: 0,
          winPct: "0.520",
          superBowlWins: 27,
          superBowlAppearances: 58,
          homeWins: 160,
          homeLosses: 140,
          homeWinPct: "0.533",
          awayWins: 152,
          awayLosses: 148,
          awayWinPct: "0.507",
          atsWins: 310,
          atsTotal: 600,
          atsPct: "0.517",
          avgHomeScore: "23.4",
          avgAwayScore: "22.1",
        },
        nflStats: {
          totalWins: 288,
          totalLosses: 312,
          totalTies: 0,
          winPct: "0.480",
          superBowlWins: 31,
          superBowlAppearances: 58,
          homeWins: 140,
          homeLosses: 160,
          homeWinPct: "0.467",
          awayWins: 148,
          awayLosses: 152,
          awayWinPct: "0.493",
          atsWins: 290,
          atsTotal: 600,
          atsPct: "0.483",
          avgHomeScore: "22.1",
          avgAwayScore: "23.4",
        },
        crossConferenceGames: 600,
        superBowlStats: { afcWins: 27, nflWins: 31 },
        seasonComparisons: [],
      },
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/components/conference-comparison-dashboard", () => ({
  default: () => <div>Conference Comparison Dashboard</div>,
}));

describe("ConferenceComparisonPage", () => {
  it("renders page title", () => {
    render(<ConferenceComparisonPage />);
    expect(screen.getByText("AFC vs NFC Comparison")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<ConferenceComparisonPage />);
    expect(screen.getAllByText(/Historical head-to-head records between/i).length).toBeGreaterThan(0);
  });

  it("renders dashboard component", () => {
    render(<ConferenceComparisonPage />);
    expect(screen.getAllByText("Conference Comparison Dashboard").length).toBeGreaterThan(0);
  });
});
