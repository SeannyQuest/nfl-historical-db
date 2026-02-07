import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import StandingsDashboard from "@/components/standings-dashboard";
import type { StandingsResult } from "@/lib/standings";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleStandings: StandingsResult = {
  season: 2024,
  divisions: [
    {
      conference: "AFC",
      division: "EAST",
      teams: [
        {
          team: { name: "Buffalo Bills", abbreviation: "BUF", city: "Buffalo", nickname: "Bills", conference: "AFC", division: "EAST" },
          wins: 13,
          losses: 4,
          ties: 0,
          pct: "0.765",
          pointsFor: 450,
          pointsAgainst: 300,
          pointDiff: 150,
          homeRecord: "7-1",
          awayRecord: "6-3",
          divRecord: "5-1",
          confRecord: "9-3",
          streak: "W4",
        },
        {
          team: { name: "Miami Dolphins", abbreviation: "MIA", city: "Miami", nickname: "Dolphins", conference: "AFC", division: "EAST" },
          wins: 9,
          losses: 8,
          ties: 0,
          pct: "0.529",
          pointsFor: 380,
          pointsAgainst: 370,
          pointDiff: 10,
          homeRecord: "5-3",
          awayRecord: "4-5",
          divRecord: "3-3",
          confRecord: "6-6",
          streak: "L1",
        },
      ],
    },
    {
      conference: "NFC",
      division: "EAST",
      teams: [
        {
          team: { name: "Philadelphia Eagles", abbreviation: "PHI", city: "Philadelphia", nickname: "Eagles", conference: "NFC", division: "EAST" },
          wins: 14,
          losses: 3,
          ties: 0,
          pct: "0.824",
          pointsFor: 480,
          pointsAgainst: 280,
          pointDiff: 200,
          homeRecord: "8-0",
          awayRecord: "6-3",
          divRecord: "6-0",
          confRecord: "10-2",
          streak: "W7",
        },
      ],
    },
  ],
};

describe("StandingsDashboard", () => {
  it("shows loading state", () => {
    render(<StandingsDashboard standings={null} isLoading={true} isError={false} />);
    expect(screen.getByText("Loading standings...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<StandingsDashboard standings={null} isLoading={false} isError={true} />);
    expect(screen.getByText("Failed to load standings.")).toBeInTheDocument();
  });

  it("renders nothing when no standings and not loading/error", () => {
    const { container } = render(<StandingsDashboard standings={null} isLoading={false} isError={false} />);
    expect(container.innerHTML).toBe("");
  });

  // Conference headers
  it("renders AFC header", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("AFC")).toBeInTheDocument();
  });

  it("renders NFC header", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("NFC")).toBeInTheDocument();
  });

  // Division headers
  it("renders division labels", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getAllByText("AFC EAST")).toHaveLength(1);
    expect(screen.getAllByText("NFC EAST")).toHaveLength(1);
  });

  // Team info
  it("renders team abbreviations", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("BUF")).toBeInTheDocument();
    expect(screen.getByText("MIA")).toBeInTheDocument();
    expect(screen.getByText("PHI")).toBeInTheDocument();
  });

  it("renders team nicknames", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("Bills")).toBeInTheDocument();
    expect(screen.getByText("Dolphins")).toBeInTheDocument();
    expect(screen.getByText("Eagles")).toBeInTheDocument();
  });

  // Records
  it("renders win counts", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("13")).toBeInTheDocument(); // BUF wins
    expect(screen.getByText("14")).toBeInTheDocument(); // PHI wins
  });

  it("renders loss counts", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("4")).toBeInTheDocument(); // BUF losses
    expect(screen.getByText("8")).toBeInTheDocument(); // MIA losses
  });

  it("renders win percentage", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("0.765")).toBeInTheDocument();
    expect(screen.getByText("0.824")).toBeInTheDocument();
  });

  // Points
  it("renders points for", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("450")).toBeInTheDocument();
    expect(screen.getByText("480")).toBeInTheDocument();
  });

  it("renders points against", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("300")).toBeInTheDocument();
    expect(screen.getByText("280")).toBeInTheDocument();
  });

  it("renders positive point diff with +", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("+150")).toBeInTheDocument();
    expect(screen.getByText("+200")).toBeInTheDocument();
  });

  // Split records
  it("renders home records", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("7-1")).toBeInTheDocument();
    expect(screen.getByText("8-0")).toBeInTheDocument();
  });

  it("renders away records", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getAllByText("6-3")).toHaveLength(2); // BUF away and PHI away
  });

  it("renders division records", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("5-1")).toBeInTheDocument();
    expect(screen.getByText("6-0")).toBeInTheDocument();
  });

  it("renders conference records", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("9-3")).toBeInTheDocument();
    expect(screen.getByText("10-2")).toBeInTheDocument();
  });

  // Streak
  it("renders winning streak", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("W4")).toBeInTheDocument();
    expect(screen.getByText("W7")).toBeInTheDocument();
  });

  it("renders losing streak", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    expect(screen.getByText("L1")).toBeInTheDocument();
  });

  // Ranking numbers
  it("renders rank numbers", () => {
    render(<StandingsDashboard standings={sampleStandings} isLoading={false} isError={false} />);
    // BUF is rank 1 in AFC EAST, MIA is rank 2
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
  });
});
