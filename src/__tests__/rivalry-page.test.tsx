import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import RivalriesPage from "@/app/rivalries/page";
import * as useGamesModule from "@/hooks/use-games";

vi.mock("@/hooks/use-games");

vi.mock("@/components/rivalry-dashboard", () => ({
  default: ({ data, isLoading, isError }: { data: unknown; isLoading: boolean; isError: boolean }) => (
    <div data-testid="dashboard">
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error</p>}
      {data && <p>Data loaded</p>}
    </div>
  ),
}));

describe("RivalriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    vi.mocked(useGamesModule.useRivalries).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<RivalriesPage />);
    expect(screen.getByText("Rivalry Tracker")).toBeTruthy();
  });

  it("renders page description", () => {
    vi.mocked(useGamesModule.useRivalries).mockReturnValue({
      data: { data: null },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<RivalriesPage />);
    const descriptions = screen.getAllByText(/Explore NFL rivalries:/);
    expect(descriptions.length).toBeGreaterThan(0);
  });

  it("passes loading state to dashboard", () => {
    vi.mocked(useGamesModule.useRivalries).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<RivalriesPage />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("passes error state to dashboard", () => {
    vi.mocked(useGamesModule.useRivalries).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<RivalriesPage />);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("passes data to dashboard", () => {
    const mockData = {
      mostPlayedMatchups: [],
      closestRivalries: [],
      highestScoringRivalries: [],
      divisionRivalries: [],
    };
    vi.mocked(useGamesModule.useRivalries).mockReturnValue({
      data: { data: mockData },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<RivalriesPage />);
    expect(screen.getByText("Data loaded")).toBeTruthy();
  });
});
