import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import UpsetPage from "@/app/upsets/page";
import * as useGamesModule from "@/hooks/use-games";

vi.mock("@/hooks/use-games");

vi.mock("@/components/upsets-dashboard", () => ({
  default: ({ data, isLoading, isError }: { data: unknown; isLoading: boolean; isError: boolean }) => (
    <div data-testid="dashboard">
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error</p>}
      {data && <p>Data loaded</p>}
    </div>
  ),
}));

describe("UpsetPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    vi.mocked(useGamesModule.useUpsets).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UpsetPage />);
    expect(screen.getByText("Upset Tracker")).toBeTruthy();
  });

  it("renders page description", () => {
    vi.mocked(useGamesModule.useUpsets).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UpsetPage />);
    const descriptions = screen.getAllByText(/Analyze underdog upsets/);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it("passes loading state to dashboard", () => {
    vi.mocked(useGamesModule.useUpsets).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UpsetPage />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("passes error state to dashboard", () => {
    vi.mocked(useGamesModule.useUpsets).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UpsetPage />);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("passes data to dashboard", () => {
    const mockData = {
      biggestUpsets: [],
      upsetRateBySeasonTrend: [],
      upsetRateBySpreadRange: [],
      upsetRateByPrimetime: [],
      upsetRateByPlayoffRound: [],
      mostCommonUpsettingTeams: [],
      longestUpsetsWinStreaks: [],
      overallUpsetRate: "0.320",
    };
    vi.mocked(useGamesModule.useUpsets).mockReturnValue({
      data: { data: mockData },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<UpsetPage />);
    expect(screen.getByText("Data loaded")).toBeTruthy();
  });
});
