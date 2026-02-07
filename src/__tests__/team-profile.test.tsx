import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import TeamProfile from "@/components/team-profile";
import type { TeamStatsResult } from "@/lib/team-stats";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleTeam = {
  name: "Kansas City Chiefs",
  abbreviation: "KC",
  city: "Kansas City",
  nickname: "Chiefs",
  conference: "AFC",
  division: "WEST",
  isActive: true,
};

const sampleStats: TeamStatsResult = {
  allTime: { wins: 500, losses: 400, ties: 10, pct: "0.556" },
  ats: { covered: 250, lost: 230, push: 20, total: 500, coverPct: "0.500" },
  ou: { over: 240, under: 250, push: 10, total: 500 },
  homeRecord: { wins: 300, losses: 150, ties: 5, pct: "0.659" },
  awayRecord: { wins: 200, losses: 250, ties: 5, pct: "0.440" },
  playoffRecord: { wins: 20, losses: 15, ties: 0, pct: "0.571" },
  avgPointsFor: "23.5",
  avgPointsAgainst: "20.1",
  seasons: [
    {
      season: 2024,
      record: { wins: 15, losses: 2, ties: 0, pct: "0.882" },
      ats: { covered: 10, lost: 6, push: 1, total: 17, coverPct: "0.588" },
      pointsFor: 450,
      pointsAgainst: 300,
    },
    {
      season: 2023,
      record: { wins: 11, losses: 6, ties: 0, pct: "0.647" },
      ats: { covered: 8, lost: 8, push: 1, total: 17, coverPct: "0.471" },
      pointsFor: 380,
      pointsAgainst: 320,
    },
  ],
};

const sampleRecentGames = [
  {
    id: "g1",
    date: "2024-12-25T12:00:00.000Z",
    week: "17",
    isPlayoff: false,
    homeTeam: { name: "Kansas City Chiefs", abbreviation: "KC" },
    awayTeam: { name: "Pittsburgh Steelers", abbreviation: "PIT" },
    homeScore: 29,
    awayScore: 10,
    winner: { name: "Kansas City Chiefs", abbreviation: "KC" },
    spreadResult: "COVERED",
    ouResult: "UNDER",
  },
  {
    id: "g2",
    date: "2024-12-15T12:00:00.000Z",
    week: "15",
    isPlayoff: false,
    homeTeam: { name: "Cleveland Browns", abbreviation: "CLE" },
    awayTeam: { name: "Kansas City Chiefs", abbreviation: "KC" },
    homeScore: 21,
    awayScore: 7,
    winner: { name: "Cleveland Browns", abbreviation: "CLE" },
    spreadResult: null,
    ouResult: null,
  },
];

describe("TeamProfile", () => {
  it("shows loading state", () => {
    render(
      <TeamProfile team={null} stats={null} recentGames={[]} totalGames={0} isLoading={true} isError={false} />
    );
    expect(screen.getByText("Loading team profile...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <TeamProfile team={null} stats={null} recentGames={[]} totalGames={0} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Team not found.")).toBeInTheDocument();
  });

  it("shows back to dashboard button on error", () => {
    render(
      <TeamProfile team={null} stats={null} recentGames={[]} totalGames={0} isLoading={false} isError={true} />
    );
    expect(screen.getByText("Back to Dashboard")).toBeInTheDocument();
  });

  it("renders team abbreviation and name", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("KC")).toBeInTheDocument();
    expect(screen.getByText("Kansas City Chiefs")).toBeInTheDocument();
  });

  it("renders conference and division", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("AFC WEST")).toBeInTheDocument();
  });

  it("renders total games count", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("910 games")).toBeInTheDocument();
  });

  it("renders all-time record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("500-400-10")).toBeInTheDocument();
  });

  it("renders home record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("300-150-5")).toBeInTheDocument();
  });

  it("renders away record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("200-250-5")).toBeInTheDocument();
  });

  it("renders playoff record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("20-15")).toBeInTheDocument();
  });

  it("renders ATS record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("250-230-20")).toBeInTheDocument();
  });

  it("renders cover rate", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("0.500")).toBeInTheDocument();
  });

  it("renders O/U record", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("240-250-10")).toBeInTheDocument();
  });

  it("renders avg points for", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("23.5")).toBeInTheDocument();
  });

  it("renders avg points against", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("20.1")).toBeInTheDocument();
  });

  it("renders recent game with W indicator for home win", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("W")).toBeInTheDocument();
  });

  it("renders recent game with L indicator for away loss", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("L")).toBeInTheDocument();
  });

  it("renders recent game opponent", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("vs PIT")).toBeInTheDocument();
    expect(screen.getByText("@ CLE")).toBeInTheDocument();
  });

  it("renders season-by-season table", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    expect(screen.getByText("15-2")).toBeInTheDocument();
    expect(screen.getByText("11-6")).toBeInTheDocument();
  });

  it("shows Historical badge for inactive teams", () => {
    const inactiveTeam = { ...sampleTeam, isActive: false };
    render(
      <TeamProfile team={inactiveTeam} stats={sampleStats} recentGames={[]} totalGames={100} isLoading={false} isError={false} />
    );
    expect(screen.getByText("Historical")).toBeInTheDocument();
  });

  it("shows no games message when recent games empty", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={[]} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("No games found")).toBeInTheDocument();
  });

  it("renders spread result in recent games", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("COVERED")).toBeInTheDocument();
  });

  it("renders O/U result in recent games", () => {
    render(
      <TeamProfile team={sampleTeam} stats={sampleStats} recentGames={sampleRecentGames} totalGames={910} isLoading={false} isError={false} />
    );
    expect(screen.getByText("UNDER")).toBeInTheDocument();
  });
});
