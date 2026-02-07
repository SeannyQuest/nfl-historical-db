import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import RecordsDashboard from "@/components/records-dashboard";
import type { RecordsResult } from "@/lib/records";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleRecords: RecordsResult = {
  highestScoringGames: [
    {
      rank: 1,
      game: {
        id: "g1",
        date: "2024-11-17T12:00:00.000Z",
        season: 2024,
        week: "11",
        isPlayoff: false,
        homeTeamName: "Kansas City Chiefs",
        homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills",
        awayTeamAbbr: "BUF",
        homeScore: 50,
        awayScore: 48,
        winnerName: "Kansas City Chiefs",
        spread: -3,
        spreadResult: "COVERED",
        ouResult: "OVER",
        overUnder: 52,
      },
      value: 98,
      label: "BUF @ KC 48-50 (98 pts)",
    },
  ],
  lowestScoringGames: [
    {
      rank: 1,
      game: {
        id: "g2",
        date: "2020-10-11T12:00:00.000Z",
        season: 2020,
        week: "5",
        isPlayoff: false,
        homeTeamName: "Denver Broncos",
        homeTeamAbbr: "DEN",
        awayTeamName: "New York Jets",
        awayTeamAbbr: "NYJ",
        homeScore: 3,
        awayScore: 0,
        winnerName: "Denver Broncos",
        spread: null,
        spreadResult: null,
        ouResult: null,
        overUnder: null,
      },
      value: 3,
      label: "NYJ @ DEN 0-3 (3 pts)",
    },
  ],
  biggestBlowouts: [
    {
      rank: 1,
      game: {
        id: "g3",
        date: "2023-12-10T12:00:00.000Z",
        season: 2023,
        week: "14",
        isPlayoff: false,
        homeTeamName: "Dallas Cowboys",
        homeTeamAbbr: "DAL",
        awayTeamName: "Philadelphia Eagles",
        awayTeamAbbr: "PHI",
        homeScore: 45,
        awayScore: 3,
        winnerName: "Dallas Cowboys",
        spread: -7,
        spreadResult: "COVERED",
        ouResult: "OVER",
        overUnder: 44,
      },
      value: 42,
      label: "PHI @ DAL 3-45 (42 pt margin)",
    },
  ],
  closestGames: [
    {
      rank: 1,
      game: {
        id: "g4",
        date: "2024-09-08T12:00:00.000Z",
        season: 2024,
        week: "1",
        isPlayoff: false,
        homeTeamName: "Green Bay Packers",
        homeTeamAbbr: "GB",
        awayTeamName: "Chicago Bears",
        awayTeamAbbr: "CHI",
        homeScore: 20,
        awayScore: 20,
        winnerName: null,
        spread: null,
        spreadResult: null,
        ouResult: null,
        overUnder: null,
      },
      value: 0,
      label: "CHI @ GB 20-20 (TIE)",
    },
  ],
  highestHomeScores: [
    {
      rank: 1,
      game: {
        id: "g1",
        date: "2024-11-17T12:00:00.000Z",
        season: 2024,
        week: "11",
        isPlayoff: false,
        homeTeamName: "Kansas City Chiefs",
        homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills",
        awayTeamAbbr: "BUF",
        homeScore: 50,
        awayScore: 48,
        winnerName: "Kansas City Chiefs",
        spread: null,
        spreadResult: null,
        ouResult: null,
        overUnder: null,
      },
      value: 50,
      label: "KC scored 50 vs BUF",
    },
  ],
  highestAwayScores: [
    {
      rank: 1,
      game: {
        id: "g1",
        date: "2024-11-17T12:00:00.000Z",
        season: 2024,
        week: "11",
        isPlayoff: false,
        homeTeamName: "Kansas City Chiefs",
        homeTeamAbbr: "KC",
        awayTeamName: "Buffalo Bills",
        awayTeamAbbr: "BUF",
        homeScore: 50,
        awayScore: 48,
        winnerName: "Kansas City Chiefs",
        spread: null,
        spreadResult: null,
        ouResult: null,
        overUnder: null,
      },
      value: 48,
      label: "BUF scored 48 @ KC",
    },
  ],
  bestTeamSeasons: [
    {
      rank: 1,
      teamName: "New England Patriots",
      teamAbbr: "NE",
      season: 2007,
      value: "1.000",
      detail: "16-0",
    },
  ],
  worstTeamSeasons: [
    {
      rank: 1,
      teamName: "Detroit Lions",
      teamAbbr: "DET",
      season: 2008,
      value: "0.000",
      detail: "0-16",
    },
  ],
};

describe("RecordsDashboard", () => {
  it("shows loading state", () => {
    render(<RecordsDashboard records={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading records...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<RecordsDashboard records={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load records.")).toBeInTheDocument();
  });

  it("renders nothing when no records and not loading/error", () => {
    const { container } = render(<RecordsDashboard records={null} isLoading={false} isError={false} />);
    expect(container.innerHTML).toBe("");
  });

  // Category buttons
  it("renders category buttons", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    // "Highest Scoring" appears as both button and panel header
    expect(screen.getAllByText("Highest Scoring").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Lowest Scoring")).toBeInTheDocument();
    expect(screen.getByText("Biggest Blowouts")).toBeInTheDocument();
    expect(screen.getByText("Closest Games")).toBeInTheDocument();
    expect(screen.getByText("Best Home Scores")).toBeInTheDocument();
    expect(screen.getByText("Best Away Scores")).toBeInTheDocument();
    expect(screen.getByText("Best Seasons")).toBeInTheDocument();
    expect(screen.getByText("Worst Seasons")).toBeInTheDocument();
  });

  // Default category: highest scoring
  it("shows highest scoring by default", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    expect(screen.getByText("98")).toBeInTheDocument();
  });

  it("renders game matchup", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    expect(screen.getAllByText("BUF").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("KC").length).toBeGreaterThanOrEqual(1);
  });

  it("renders game scores", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders season year", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders rank number", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  // Category switching
  it("switches to blowouts", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    fireEvent.click(screen.getByText("Biggest Blowouts"));
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("DAL")).toBeInTheDocument();
  });

  it("switches to closest games", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    fireEvent.click(screen.getByText("Closest Games"));
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("switches to best seasons", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    fireEvent.click(screen.getByText("Best Seasons"));
    expect(screen.getByText("NE")).toBeInTheDocument();
    expect(screen.getByText("16-0")).toBeInTheDocument();
    expect(screen.getByText("1.000")).toBeInTheDocument();
    expect(screen.getByText("2007")).toBeInTheDocument();
  });

  it("switches to worst seasons", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    fireEvent.click(screen.getByText("Worst Seasons"));
    expect(screen.getByText("DET")).toBeInTheDocument();
    expect(screen.getByText("0-16")).toBeInTheDocument();
    expect(screen.getByText("0.000")).toBeInTheDocument();
  });

  it("switches to lowest scoring", () => {
    render(<RecordsDashboard records={sampleRecords} isLoading={false} isError={false} />);
    fireEvent.click(screen.getByText("Lowest Scoring"));
    // "3" appears as both score and value column
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("DEN")).toBeInTheDocument();
  });

  // Empty category
  it("shows no records message for empty category", () => {
    const emptyRecords = { ...sampleRecords, highestScoringGames: [] };
    render(<RecordsDashboard records={emptyRecords} isLoading={false} isError={false} />);
    expect(screen.getByText("No records found")).toBeInTheDocument();
  });
});
