import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GameFinder from "@/components/game-finder";

vi.mock("@/hooks/use-games", () => ({
  useGameFinder: vi.fn(),
  useTeams: vi.fn(),
  useSeasons: vi.fn(),
}));

import * as useGamesHooks from "@/hooks/use-games";

describe("GameFinder", () => {
  const mockGames = [
    {
      id: "1",
      date: "2024-09-08",
      homeTeam: { id: "1", name: "Green Bay Packers" },
      awayTeam: { id: "2", name: "Chicago Bears" },
      homeScore: 27,
      awayScore: 20,
      season: { id: "1", year: 2024 },
    },
    {
      id: "2",
      date: "2024-09-15",
      homeTeam: { id: "3", name: "Detroit Lions" },
      awayTeam: { id: "4", name: "Tampa Bay Buccaneers" },
      homeScore: 31,
      awayScore: 23,
      season: { id: "1", year: 2024 },
    },
  ];

  const mockTeams = [
    { id: "1", name: "Green Bay Packers" },
    { id: "2", name: "Chicago Bears" },
    { id: "3", name: "Detroit Lions" },
  ];

  const mockSeasons = [
    { id: "1", year: 2024 },
    { id: "2", year: 2023 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: mockGames },
      isLoading: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useTeams as any).mockReturnValue({
      data: { data: mockTeams },
      isLoading: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useSeasons as any).mockReturnValue({
      data: { data: mockSeasons },
      isLoading: false,
    });
  });

  it("renders filter form", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("Filter Games").length > 0).toBeTruthy();
  });

  it("renders score input fields", () => {
    render(<GameFinder />);
    const inputs = screen.getAllByPlaceholderText("0");
    expect(inputs.length).toBeGreaterThanOrEqual(2); // Min Score and Min Total Points both have 0
    expect(screen.getByPlaceholderText("100")).toBeInTheDocument();
  });

  it("renders total points input fields", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("Min Total Points").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Max Total Points").length > 0).toBeTruthy();
  });

  it("renders date input fields", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Start Date/i).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/End Date/i).length > 0).toBeTruthy();
  });

  it("renders team dropdown", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Team/i).length > 0).toBeTruthy();
  });

  it("populates team dropdown with teams", () => {
    render(<GameFinder />);
    const teamSelects = screen.getAllByRole("combobox");
    const teamSelect = teamSelects[0] as HTMLSelectElement;
    expect(teamSelect.options.length).toBe(4); // All Teams + 3 teams
  });

  it("renders season dropdown", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Season/i).length > 0).toBeTruthy();
  });

  it("populates season dropdown with seasons", () => {
    render(<GameFinder />);
    const seasonSelects = screen.getAllByRole("combobox");
    const seasonSelect = seasonSelects[1] as HTMLSelectElement;
    expect(seasonSelect.options.length).toBe(3); // All Seasons + 2 seasons
  });

  it("renders betting perspective dropdown", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Betting Perspective/i).length > 0).toBeTruthy();
  });

  it("renders overtime checkbox", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Overtime Games Only/i).length > 0).toBeTruthy();
  });

  it("displays game count", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("Games Found").length > 0).toBeTruthy();
    expect(screen.queryAllByText("2").length > 0).toBeTruthy();
  });

  it("renders export JSON button", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("Export as JSON").length > 0).toBeTruthy();
  });

  it("renders results table when games exist", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/Date/i).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/Home Team/i).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/Score/i).length > 0).toBeTruthy();
    expect(screen.queryAllByText(/Away Team/i).length > 0).toBeTruthy();
  });

  it("displays games in table", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("Green Bay Packers").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Chicago Bears").length > 0).toBeTruthy();
    expect(screen.queryAllByText("27-20").length > 0).toBeTruthy();
  });

  it("displays game date in table", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText(/9\/8\/2024/).length > 0).toBeTruthy();
  });

  it("displays total points in table", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("47").length > 0).toBeTruthy(); // 27+20
  });

  it("displays season in table", () => {
    render(<GameFinder />);
    expect(screen.queryAllByText("2024").length > 0).toBeTruthy();
  });

  it("shows message when no games found", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    render(<GameFinder />);
    expect(screen.queryAllByText(/No games found/i).length > 0).toBeTruthy();
  });

  it("disables export button when no games", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
    render(<GameFinder />);
    const exportBtn = screen.getByText("Export as JSON") as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
  });

  it("shows loading state when fetching games", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: [] },
      isLoading: true,
    });
    render(<GameFinder />);
    expect(screen.queryAllByText(/Loading games/i).length > 0).toBeTruthy();
  });

  it("disables export button while loading", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: mockGames },
      isLoading: true,
    });
    render(<GameFinder />);
    const exportBtn = screen.getByText("Export as JSON") as HTMLButtonElement;
    expect(exportBtn.disabled).toBe(true);
  });

  it("handles filter changes", () => {
    const { useGameFinder } = useGamesHooks;
    render(<GameFinder />);
    const minScoreInput = screen.getAllByPlaceholderText("0")[0] as HTMLInputElement;
    fireEvent.change(minScoreInput, { target: { value: "20" } });
    expect(minScoreInput.value).toBe("20");
  });

  it("allows exporting games as JSON", async () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
    const revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL");

    render(<GameFinder />);
    const exportBtns = screen.getAllByText("Export as JSON");
    fireEvent.click(exportBtns[0]);

    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it("shows up to 20 games in table", () => {
    const manyGames = Array(25)
      .fill(null)
      .map((_, i) => ({
        id: String(i),
        date: "2024-09-08",
        homeTeam: { id: "1", name: "Team A" },
        awayTeam: { id: "2", name: "Team B" },
        homeScore: 20 + i,
        awayScore: 10 + i,
        season: { id: "1", year: 2024 },
      }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useGamesHooks.useGameFinder as any).mockReturnValue({
      data: { data: manyGames },
      isLoading: false,
    });

    render(<GameFinder />);
    expect(screen.queryAllByText(/Showing 20 of 25/).length > 0).toBeTruthy();
  });

  it("renders all filter input fields", () => {
    render(<GameFinder />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("renders all dropdown fields", () => {
    render(<GameFinder />);
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("displays score correctly in table", () => {
    render(<GameFinder />);
    const scoreCells = screen.getAllByText("27-20");
    expect(scoreCells.length).toBeGreaterThan(0);
  });
});
