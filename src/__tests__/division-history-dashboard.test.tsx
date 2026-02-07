import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DivisionHistoryDashboard from "@/components/division-history-dashboard";
import type { DivisionHistoryResult } from "@/lib/division-history";

const mockData: DivisionHistoryResult = {
  divisionWinners: [
    { season: 2023, divisionName: "AFC West", winnerName: "Kansas City Chiefs", wins: 14, losses: 3, ties: 0 },
  ],
  divisionDominance: [
    { teamName: "KC", division: "AFC West", titles: 6, seasons: "2018-2023" },
    { teamName: "SF", division: "NFC West", titles: 5, seasons: "2019-2023" },
  ],
  intraDivisionRecords: [
    { teamName: "KC", division: "AFC West", wins: 42, losses: 18, ties: 0, pct: "0.700" },
  ],
  divisionStrengthByYear: [
    { season: 2023, division: "AFC West", avgWinPct: "0.525", winPctSpread: "0.095" },
  ],
  mostCompetitiveDivisions: [
    { season: 2023, division: "NFC East", spread: "0.050" },
  ],
};

describe("DivisionHistoryDashboard", () => {
  it("renders loading state", () => {
    render(<DivisionHistoryDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.queryByText("Loading division history...") ?? screen.getAllByText("Loading division history...").length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(<DivisionHistoryDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.queryByText("Failed to load division history.") ?? screen.getAllByText("Failed to load division history.").length > 0).toBeTruthy();
  });

  it("renders dashboard with data", () => {
    render(<DivisionHistoryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("KC").length > 0).toBeTruthy();
    expect(screen.queryAllByText("AFC West").length > 0).toBeTruthy();
  });

  it("displays stat boxes", () => {
    render(<DivisionHistoryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Total Winners").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Top Franchise").length > 0).toBeTruthy();
  });

  it("displays division dominance", () => {
    render(<DivisionHistoryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Division Dominance Rankings").length > 0).toBeTruthy();
  });

  it("displays intra-division records", () => {
    render(<DivisionHistoryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Top Intra-Division Records").length > 0).toBeTruthy();
  });

  it("displays most competitive divisions", () => {
    render(<DivisionHistoryDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Most Competitive Divisions").length > 0).toBeTruthy();
  });
});
