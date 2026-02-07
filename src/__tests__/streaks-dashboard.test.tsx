import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StreaksDashboard from "@/components/streaks-dashboard";
import type { StreaksResult } from "@/lib/streaks";

const mockData: StreaksResult = {
  currentStreaks: [
    { teamName: "KC", streakType: "WIN", currentStreak: 5, season: 2023, allTimeRecord: 0, allTimeSeasons: "2020-2023" },
  ],
  longestWinningStreaks: [
    { teamName: "SF", streakType: "WIN", currentStreak: 0, season: 1994, allTimeRecord: 16, allTimeSeasons: "1994" },
  ],
  longestLosingStreaks: [
    { teamName: "DET", streakType: "LOSS", currentStreak: 0, season: 2008, allTimeRecord: 16, allTimeSeasons: "2008" },
  ],
  longestHomeWinStreaks: [],
  longestAwayWinStreaks: [],
  longestATSStreaks: [],
  longestOverStreaks: [],
};

describe("StreaksDashboard", () => {
  it("renders loading state", () => {
    render(<StreaksDashboard data={null} isLoading={true} isError={false} />);
    expect(screen.queryByText("Loading streaks data...") ?? screen.getAllByText("Loading streaks data...").length > 0).toBeTruthy();
  });

  it("renders error state", () => {
    render(<StreaksDashboard data={null} isLoading={false} isError={true} />);
    expect(screen.queryByText("Failed to load streaks data.") ?? screen.getAllByText("Failed to load streaks data.").length > 0).toBeTruthy();
  });

  it("renders dashboard with data", () => {
    render(<StreaksDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryByText("KC") ?? screen.getAllByText("KC").length > 0).toBeTruthy();
    expect(screen.queryByText("SF") ?? screen.getAllByText("SF").length > 0).toBeTruthy();
  });

  it("displays stat boxes", () => {
    render(<StreaksDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Active Streaks").length > 0).toBeTruthy();
    expect(screen.queryAllByText("Longest Win").length > 0).toBeTruthy();
  });

  it("displays current streaks", () => {
    render(<StreaksDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("Active Streaks").length > 0).toBeTruthy();
  });

  it("displays longest winning streaks", () => {
    render(<StreaksDashboard data={mockData} isLoading={false} isError={false} />);
    expect(screen.queryAllByText("All-Time Longest Winning Streaks").length > 0).toBeTruthy();
  });
});
