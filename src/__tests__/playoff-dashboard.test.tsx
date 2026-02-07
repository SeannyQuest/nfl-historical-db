import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import PlayoffDashboard from "@/components/playoff-dashboard";
import type { PlayoffStatsResult } from "@/lib/playoff-stats";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleStats: PlayoffStatsResult = {
  teamRecords: [
    {
      teamName: "Kansas City Chiefs",
      teamAbbr: "KC",
      totalWins: 15,
      totalLosses: 8,
      totalGames: 23,
      winPct: "0.652",
      superBowlWins: 3,
      superBowlLosses: 1,
      superBowlAppearances: 4,
      confChampWins: 4,
      confChampLosses: 2,
      divRoundWins: 5,
      divRoundLosses: 3,
      wildCardWins: 3,
      wildCardLosses: 2,
      lastPlayoffSeason: 2024,
      playoffSeasons: 12,
      superBowlWinSeasons: [2019, 2022, 2023],
    },
    {
      teamName: "Buffalo Bills",
      teamAbbr: "BUF",
      totalWins: 8,
      totalLosses: 10,
      totalGames: 18,
      winPct: "0.444",
      superBowlWins: 0,
      superBowlLosses: 4,
      superBowlAppearances: 4,
      confChampWins: 4,
      confChampLosses: 2,
      divRoundWins: 3,
      divRoundLosses: 2,
      wildCardWins: 1,
      wildCardLosses: 2,
      lastPlayoffSeason: 2023,
      playoffSeasons: 10,
      superBowlWinSeasons: [],
    },
  ],
  superBowlHistory: [
    {
      season: 2023,
      winnerName: "Kansas City Chiefs",
      winnerAbbr: "KC",
      loserName: "San Francisco 49ers",
      loserAbbr: "SF",
      winnerScore: 25,
      loserScore: 22,
      gameId: "sb-2023",
    },
    {
      season: 2022,
      winnerName: "Kansas City Chiefs",
      winnerAbbr: "KC",
      loserName: "Philadelphia Eagles",
      loserAbbr: "PHI",
      winnerScore: 38,
      loserScore: 35,
      gameId: "sb-2022",
    },
  ],
  seasonSummaries: [
    {
      season: 2023,
      totalGames: 13,
      avgTotal: 44.2,
      highestTotal: 73,
      lowestTotal: 20,
      homeWins: 8,
      awayWins: 5,
      superBowlWinner: "Kansas City Chiefs",
      superBowlWinnerAbbr: "KC",
    },
    {
      season: 2022,
      totalGames: 13,
      avgTotal: 46.1,
      highestTotal: 78,
      lowestTotal: 23,
      homeWins: 7,
      awayWins: 6,
      superBowlWinner: "Kansas City Chiefs",
      superBowlWinnerAbbr: "KC",
    },
  ],
  totals: {
    totalGames: 500,
    totalSeasons: 40,
    avgTotal: 42.5,
    homeWinPct: "0.578",
    highestScoringGame: {
      label: "BUF @ KC (51-54)",
      value: 105,
      gameId: "hsg-1",
    },
  },
};

describe("PlayoffDashboard", () => {
  // ─── Loading/Error states ─────────────────────────────
  it("shows loading state", () => {
    render(
      <PlayoffDashboard stats={null} isLoading={true} isError={false} />
    );
    expect(screen.getByText("Loading playoff stats...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <PlayoffDashboard stats={null} isLoading={false} isError={true} />
    );
    expect(
      screen.getByText("Failed to load playoff stats.")
    ).toBeInTheDocument();
  });

  it("renders nothing when no stats and not loading/error", () => {
    const { container } = render(
      <PlayoffDashboard stats={null} isLoading={false} isError={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  // ─── Overview stat boxes ──────────────────────────────
  it("shows total playoff games", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("500")).toBeInTheDocument();
  });

  it("shows total seasons", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("40 seasons")).toBeInTheDocument();
  });

  it("shows avg total points", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("42.5")).toBeInTheDocument();
  });

  it("shows home win percentage", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("0.578")).toBeInTheDocument();
  });

  it("shows super bowl count with latest winner", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Latest: KC (2023)")).toBeInTheDocument();
  });

  // ─── Tab navigation ───────────────────────────────────
  it("renders all tabs", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Team Records")).toBeInTheDocument();
    expect(screen.getByText("Super Bowl History")).toBeInTheDocument();
    expect(screen.getByText("By Season")).toBeInTheDocument();
  });

  // ─── Team Records tab (default) ──────────────────────
  it("shows team abbreviations in records", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getAllByText("KC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BUF").length).toBeGreaterThanOrEqual(1);
  });

  it("shows team W-L records", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("15-8")).toBeInTheDocument();
    expect(screen.getByText("8-10")).toBeInTheDocument();
  });

  it("shows team win percentages", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("0.652")).toBeInTheDocument();
    expect(screen.getByText("0.444")).toBeInTheDocument();
  });

  it("shows SB wins for teams with championships", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    // KC has 3 SB wins and 1 loss, displayed as "3-1"
    const sbCells = screen.getAllByText("3");
    expect(sbCells.length).toBeGreaterThanOrEqual(1);
  });

  it("shows SB losses for teams without wins", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    // BUF 0-4 in SB
    expect(screen.getByText("0-4")).toBeInTheDocument();
  });

  // ─── Super Bowl History tab ───────────────────────────
  it("switches to SB history tab", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("Super Bowl History"));
    expect(screen.getByText("Champion")).toBeInTheDocument();
    expect(screen.getByText("Runner-Up")).toBeInTheDocument();
  });

  it("shows SB champion and score", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("Super Bowl History"));
    expect(screen.getAllByText("25").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("22").length).toBeGreaterThanOrEqual(1);
  });

  it("shows SB runner-up", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("Super Bowl History"));
    expect(screen.getByText("SF")).toBeInTheDocument();
    expect(screen.getByText("PHI")).toBeInTheDocument();
  });

  it("shows SB seasons", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("Super Bowl History"));
    expect(screen.getAllByText("2023").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2022").length).toBeGreaterThanOrEqual(1);
  });

  // ─── By Season tab ───────────────────────────────────
  it("switches to season summary tab", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("By Season"));
    expect(screen.getByText("Avg Total")).toBeInTheDocument();
  });

  it("shows season game counts", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("By Season"));
    expect(screen.getAllByText("13").length).toBeGreaterThanOrEqual(2);
  });

  it("shows season avg totals", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("By Season"));
    expect(screen.getByText("44.2")).toBeInTheDocument();
    expect(screen.getByText("46.1")).toBeInTheDocument();
  });

  it("shows season champion abbreviation", () => {
    render(
      <PlayoffDashboard
        stats={sampleStats}
        isLoading={false}
        isError={false}
      />
    );
    fireEvent.click(screen.getByText("By Season"));
    // KC appears as champion for both seasons
    expect(screen.getAllByText("KC").length).toBeGreaterThanOrEqual(1);
  });
});
