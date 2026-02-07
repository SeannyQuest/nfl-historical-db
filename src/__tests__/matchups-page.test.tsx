import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-games", () => ({
  useTeams: () => ({
    data: {
      data: [
        { name: "Kansas City Chiefs", abbreviation: "KC" },
        { name: "Buffalo Bills", abbreviation: "BUF" },
        { name: "Green Bay Packers", abbreviation: "GB" },
      ],
    },
  }),
  useMatchup: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import MatchupsPage from "@/app/matchups/page";

afterEach(cleanup);

describe("MatchupsPage", () => {
  it("renders page title", () => {
    render(<MatchupsPage />);
    expect(screen.getByText("Head-to-Head Matchups")).toBeInTheDocument();
  });

  it("renders team selector dropdowns", () => {
    render(<MatchupsPage />);
    expect(screen.getByLabelText("Select team 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Select team 2")).toBeInTheDocument();
  });

  it("shows team options in dropdowns", () => {
    render(<MatchupsPage />);
    expect(screen.getAllByText("Kansas City Chiefs")).toHaveLength(2); // appears in both dropdowns
  });

  it("shows prompt when no teams selected", () => {
    render(<MatchupsPage />);
    expect(screen.getByText("Select two teams to compare their head-to-head history")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<MatchupsPage />);
    expect(screen.getByText(/Compare historical records/)).toBeInTheDocument();
  });
});
