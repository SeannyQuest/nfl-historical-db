import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import HomeAdvantagePage from "@/app/home-advantage/page";
import * as useGamesModule from "@/hooks/use-games";

vi.mock("@/hooks/use-games");

vi.mock("@/components/home-advantage-dashboard", () => ({
  default: ({ data, isLoading, isError }: { data: unknown; isLoading: boolean; isError: boolean }) => (
    <div data-testid="dashboard">
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error</p>}
      {data && <p>Data loaded</p>}
    </div>
  ),
}));

describe("HomeAdvantagePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    vi.mocked(useGamesModule.useHomeAdvantage).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<HomeAdvantagePage />);
    expect(screen.getByText("Home Field Advantage")).toBeTruthy();
  });

  it("renders page description", () => {
    vi.mocked(useGamesModule.useHomeAdvantage).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<HomeAdvantagePage />);
    const descriptions = screen.getAllByText(/Comprehensive analysis of home-field advantage across NFL seasons/);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it("passes loading state to dashboard", () => {
    vi.mocked(useGamesModule.useHomeAdvantage).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<HomeAdvantagePage />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("passes error state to dashboard", () => {
    vi.mocked(useGamesModule.useHomeAdvantage).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<HomeAdvantagePage />);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("passes data to dashboard", () => {
    const mockData = {
      overallHomeWinRate: "0.575",
      homeWinRateBySeasonTrend: [],
      homeWinRateByDayOfWeek: [],
      homeWinRateByPrimetime: [],
      playoffVsRegularHomeWinRate: { regular: "0.57", playoff: "0.60" },
      homeScoringAdvantage: "2.5",
      homeCoverRate: "0.520",
      bestHomeTeams: [],
      worstHomeTeams: [],
      domeVsOutdoorAdvantage: { dome: null, outdoor: null },
    };
    vi.mocked(useGamesModule.useHomeAdvantage).mockReturnValue({
      data: { data: mockData },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<HomeAdvantagePage />);
    expect(screen.getByText("Data loaded")).toBeTruthy();
  });
});
