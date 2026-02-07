import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import StatCard from "@/components/stat-card";
import GameTable from "@/components/game-table";
import Pagination from "@/components/pagination";
import FilterBar from "@/components/filter-bar";

afterEach(cleanup);

// ─── StatCard ───────────────────────────────────────────

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Games" value="14,140" />);
    expect(screen.getByText("Total Games")).toBeInTheDocument();
    expect(screen.getByText("14,140")).toBeInTheDocument();
  });

  it("renders detail text when provided", () => {
    render(<StatCard label="Seasons" value={60} detail="1966-2025" />);
    expect(screen.getByText("1966-2025")).toBeInTheDocument();
  });

  it("does not render detail when not provided", () => {
    const { container } = render(<StatCard label="Count" value={0} />);
    const detailElements = container.querySelectorAll("p");
    // Only label and value, no detail
    expect(detailElements).toHaveLength(2);
  });
});

// ─── GameTable ──────────────────────────────────────────

const sampleGame = {
  id: "clz1",
  date: "2024-09-08T12:00:00.000Z",
  week: "1",
  dayOfWeek: "Sun",
  homeScore: 27,
  awayScore: 20,
  scoreDiff: 7,
  primetime: "SNF",
  isPlayoff: false,
  homeTeam: { name: "Kansas City Chiefs", abbreviation: "KC" },
  awayTeam: { name: "Baltimore Ravens", abbreviation: "BAL" },
  winner: { name: "Kansas City Chiefs", abbreviation: "KC" },
  bettingLine: {
    spread: -3.5,
    overUnder: 47.5,
    spreadResult: "COVERED",
    ouResult: "UNDER",
  },
};

describe("GameTable", () => {
  it("shows loading state", () => {
    render(<GameTable games={[]} isLoading={true} />);
    expect(screen.getByText("Loading games...")).toBeInTheDocument();
  });

  it("shows empty state when no games", () => {
    render(<GameTable games={[]} isLoading={false} />);
    expect(
      screen.getByText("No games found matching your filters.")
    ).toBeInTheDocument();
  });

  it("renders game rows", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("KC")).toBeInTheDocument();
    expect(screen.getByText("BAL")).toBeInTheDocument();
  });

  it("displays scores", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("displays total score", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("Total: 47")).toBeInTheDocument();
  });

  it("shows primetime badge", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("SNF")).toBeInTheDocument();
  });

  it("shows spread result", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("COVERED")).toBeInTheDocument();
  });

  it("shows O/U result", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("UNDER")).toBeInTheDocument();
  });

  it("shows formatted date", () => {
    render(<GameTable games={[sampleGame]} isLoading={false} />);
    expect(screen.getByText("Sep 8, 2024")).toBeInTheDocument();
  });

  it("renders game without betting data", () => {
    const noBetting = { ...sampleGame, bettingLine: null };
    render(<GameTable games={[noBetting]} isLoading={false} />);
    expect(screen.getByText("KC")).toBeInTheDocument();
  });
});

// ─── Pagination ─────────────────────────────────────────

describe("Pagination", () => {
  const defaultProps = {
    page: 2,
    totalPages: 10,
    total: 250,
    limit: 25,
    onPageChange: () => {},
  };

  it("shows page range text", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/26–50 of 250/)).toBeInTheDocument();
  });

  it("shows current page / total", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText("2 / 10")).toBeInTheDocument();
  });

  it("has Previous and Next buttons", () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("disables Previous on page 1", () => {
    render(<Pagination {...defaultProps} page={1} />);
    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("disables Next on last page", () => {
    render(<Pagination {...defaultProps} page={10} />);
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("returns null when total is 0", () => {
    const { container } = render(
      <Pagination {...defaultProps} total={0} />
    );
    expect(container.innerHTML).toBe("");
  });
});

// ─── FilterBar ──────────────────────────────────────────

describe("FilterBar", () => {
  const defaultProps = {
    season: "",
    week: "",
    team: "",
    onSeasonChange: () => {},
    onWeekChange: () => {},
    onTeamChange: () => {},
    onReset: () => {},
    seasons: [2024, 2023, 2022],
    weeks: ["1", "2", "WildCard", "SuperBowl"],
    teams: ["Kansas City Chiefs", "Green Bay Packers"],
  };

  it("renders season dropdown", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByLabelText("Filter by season")).toBeInTheDocument();
  });

  it("renders week dropdown", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByLabelText("Filter by week")).toBeInTheDocument();
  });

  it("renders team dropdown", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByLabelText("Filter by team")).toBeInTheDocument();
  });

  it("shows team options", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Kansas City Chiefs")).toBeInTheDocument();
  });

  it("shows Clear filters button when filters active", () => {
    render(<FilterBar {...defaultProps} season="2024" />);
    expect(screen.getByText("Clear filters")).toBeInTheDocument();
  });

  it("hides Clear filters button when no filters", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText("Clear filters")).not.toBeInTheDocument();
  });

  it("renders Super Bowl week label", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Super Bowl")).toBeInTheDocument();
  });

  it("renders Wild Card week label", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Wild Card")).toBeInTheDocument();
  });
});
