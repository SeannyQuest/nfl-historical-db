import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import MatchupComparison from "@/components/matchup-comparison";
import type { MatchupResult } from "@/lib/matchups";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const team1Info = { name: "Kansas City Chiefs", abbreviation: "KC", city: "Kansas City", nickname: "Chiefs" };
const team2Info = { name: "Buffalo Bills", abbreviation: "BUF", city: "Buffalo", nickname: "Bills" };

const sampleMatchup: MatchupResult & { team1Info: typeof team1Info; team2Info: typeof team2Info } = {
  team1: "Kansas City Chiefs",
  team2: "Buffalo Bills",
  totalGames: 65,
  team1Record: { wins: 35, losses: 28, ties: 2, pct: "0.538" },
  team2Record: { wins: 28, losses: 35, ties: 2, pct: "0.431" },
  scoring: {
    avgTotal: "42.5",
    avgMargin: "8.3",
    highestTotal: 87,
    lowestTotal: 13,
  },
  betting: {
    favoriteRecord: "Kansas City Chiefs favored 20x, covered 12",
    avgSpread: "4.5",
    overCount: 15,
    underCount: 12,
    pushCount: 1,
    overPct: "0.536",
  },
  recentGames: [
    {
      date: "2024-11-17T12:00:00.000Z",
      season: 2024,
      week: "11",
      isPlayoff: false,
      homeTeamName: "Kansas City Chiefs",
      awayTeamName: "Buffalo Bills",
      homeScore: 30,
      awayScore: 21,
      winnerName: "Kansas City Chiefs",
      spread: -2.5,
      spreadResult: "COVERED",
      ouResult: "OVER",
    },
    {
      date: "2024-01-21T12:00:00.000Z",
      season: 2023,
      week: "Division",
      isPlayoff: true,
      homeTeamName: "Buffalo Bills",
      awayTeamName: "Kansas City Chiefs",
      homeScore: 24,
      awayScore: 27,
      winnerName: "Kansas City Chiefs",
      spread: null,
      spreadResult: null,
      ouResult: null,
    },
  ],
  streakTeam: "Kansas City Chiefs",
  streakCount: 3,
  team1Info,
  team2Info,
};

describe("MatchupComparison", () => {
  it("shows loading state", () => {
    render(<MatchupComparison matchup={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading matchup data...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<MatchupComparison matchup={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load matchup data.")).toBeInTheDocument();
  });

  it("renders nothing when no matchup data and not loading/error", () => {
    const { container } = render(<MatchupComparison matchup={null} isLoading={false} isError={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders team abbreviations", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    // KC/BUF appear in header and in recent games table
    expect(screen.getAllByText("KC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BUF").length).toBeGreaterThanOrEqual(1);
  });

  it("renders team cities", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("Kansas City")).toBeInTheDocument();
    expect(screen.getByText("Buffalo")).toBeInTheDocument();
  });

  it("renders team nicknames", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("Chiefs")).toBeInTheDocument();
    expect(screen.getByText("Bills")).toBeInTheDocument();
  });

  it("renders total games count", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("65")).toBeInTheDocument();
    expect(screen.getByText("games")).toBeInTheDocument();
  });

  it("renders team1 record", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("35-28-2")).toBeInTheDocument();
  });

  it("renders team2 record", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("28-35-2")).toBeInTheDocument();
  });

  it("renders win streak", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("KC 3W")).toBeInTheDocument();
  });

  it("renders scoring trends", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("42.5")).toBeInTheDocument();
    expect(screen.getByText("8.3")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
  });

  it("renders betting favorite info", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("Kansas City Chiefs favored 20x, covered 12")).toBeInTheDocument();
  });

  it("renders avg spread", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("renders O/U record", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("15-12-1")).toBeInTheDocument();
  });

  it("renders over pct", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("0.536")).toBeInTheDocument();
  });

  // Recent games table
  it("renders recent game dates", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("Nov 17, 2024")).toBeInTheDocument();
    expect(screen.getByText("Jan 21, 2024")).toBeInTheDocument();
  });

  it("renders recent game scores", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
  });

  it("renders ATS result in recent games", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("COVERED")).toBeInTheDocument();
  });

  it("renders O/U result in recent games", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("OVER")).toBeInTheDocument();
  });

  it("renders playoff week label", () => {
    render(<MatchupComparison matchup={sampleMatchup} isLoading={false} isError={false} />);
    expect(screen.getByText("Division")).toBeInTheDocument();
  });

  it("shows no games message when empty", () => {
    const noGames = { ...sampleMatchup, recentGames: [] };
    render(<MatchupComparison matchup={noGames} isLoading={false} isError={false} />);
    expect(screen.getByText("No games found")).toBeInTheDocument();
  });

  it("does not show streak when no streak", () => {
    const noStreak = { ...sampleMatchup, streakTeam: null, streakCount: 0 };
    render(<MatchupComparison matchup={noStreak} isLoading={false} isError={false} />);
    expect(screen.queryByText(/\dW$/)).not.toBeInTheDocument();
  });
});
