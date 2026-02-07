import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import GameDetail from "@/components/game-detail";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleGame = {
  id: "clz1",
  date: "2024-09-08T12:00:00.000Z",
  week: "1",
  time: "1:00PM",
  dayOfWeek: "Sun",
  homeScore: 27,
  awayScore: 20,
  scoreDiff: 7,
  primetime: "SNF",
  isPlayoff: false,
  homeTeam: { name: "Kansas City Chiefs", abbreviation: "KC", city: "Kansas City", nickname: "Chiefs" },
  awayTeam: { name: "Baltimore Ravens", abbreviation: "BAL", city: "Baltimore", nickname: "Ravens" },
  winner: { name: "Kansas City Chiefs", abbreviation: "KC" },
  season: { year: 2024 },
  bettingLine: {
    spread: -3.5,
    overUnder: 47.5,
    spreadResult: "COVERED",
    ouResult: "UNDER",
  },
  weather: {
    temperature: 72,
    wind: "8 mph",
    conditions: "Clear",
  },
};

describe("GameDetail", () => {
  it("shows loading state", () => {
    render(<GameDetail game={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading game details...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<GameDetail game={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Game not found.")).toBeInTheDocument();
  });

  it("shows back button on error", () => {
    render(<GameDetail game={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  it("renders team abbreviations in scoreboard", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("KC")).toBeInTheDocument();
    expect(screen.getByText("BAL")).toBeInTheDocument();
  });

  it("renders team cities", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Kansas City")).toBeInTheDocument();
    expect(screen.getByText("Baltimore")).toBeInTheDocument();
  });

  it("renders team nicknames", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Chiefs")).toBeInTheDocument();
    expect(screen.getByText("Ravens")).toBeInTheDocument();
  });

  it("renders scores", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("shows WINNER badge for winning team", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("WINNER")).toBeInTheDocument();
  });

  it("shows point margin", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("7 point margin")).toBeInTheDocument();
  });

  it("shows total score", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Total: 47")).toBeInTheDocument();
  });

  it("shows primetime badge", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("SNF")).toBeInTheDocument();
  });

  it("shows formatted date", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Sunday, September 8, 2024")).toBeInTheDocument();
  });

  it("shows season year", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("2024 Season")).toBeInTheDocument();
  });

  it("shows week", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    const weekElements = screen.getAllByText("Week 1");
    expect(weekElements.length).toBeGreaterThanOrEqual(1);
  });

  it("shows kickoff time", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    const kickoffs = screen.getAllByText("1:00PM ET");
    expect(kickoffs.length).toBeGreaterThan(0);
  });

  // Betting panel
  it("shows spread value", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("KC -3.5")).toBeInTheDocument();
  });

  it("shows over/under value", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("47.5")).toBeInTheDocument();
  });

  it("shows ATS result", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("COVERED")).toBeInTheDocument();
  });

  it("shows O/U result", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("UNDER")).toBeInTheDocument();
  });

  // Weather panel
  it("shows weather conditions", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("shows wind", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("8 mph")).toBeInTheDocument();
  });

  // No data states
  it("shows no betting data message when absent", () => {
    const noBetting = { ...sampleGame, bettingLine: null };
    render(<GameDetail game={noBetting} isLoading={false} isError={false} />);
    expect(screen.getByText("No betting data available")).toBeInTheDocument();
  });

  it("shows no weather data message when absent", () => {
    const noWeather = { ...sampleGame, weather: null };
    render(<GameDetail game={noWeather} isLoading={false} isError={false} />);
    expect(screen.getByText("No weather data available")).toBeInTheDocument();
  });

  // Tie game
  it("shows TIE badge for tied games", () => {
    const tieGame = { ...sampleGame, homeScore: 20, awayScore: 20, scoreDiff: 0, winner: null };
    render(<GameDetail game={tieGame} isLoading={false} isError={false} />);
    expect(screen.getByText("TIE")).toBeInTheDocument();
  });

  // Playoff game
  it("shows Playoff badge for playoff games", () => {
    const playoff = { ...sampleGame, isPlayoff: true, week: "SuperBowl" };
    render(<GameDetail game={playoff} isLoading={false} isError={false} />);
    expect(screen.getByText("Playoff")).toBeInTheDocument();
  });

  it("shows back to games link", () => {
    render(<GameDetail game={sampleGame} isLoading={false} isError={false} />);
    expect(screen.getByText("Back to Games")).toBeInTheDocument();
  });
});
