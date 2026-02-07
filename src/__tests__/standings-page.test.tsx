import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-games", () => ({
  useStandings: () => ({ data: null, isLoading: false, isError: false }),
  useSeasons: () => ({
    data: {
      data: [{ year: 2024 }, { year: 2023 }, { year: 2022 }],
    },
  }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import StandingsPage from "@/app/standings/page";

afterEach(cleanup);

describe("StandingsPage", () => {
  it("renders page title", () => {
    render(<StandingsPage />);
    expect(screen.getByText("Standings")).toBeInTheDocument();
  });

  it("renders season selector", () => {
    render(<StandingsPage />);
    expect(screen.getByLabelText("Select season")).toBeInTheDocument();
  });

  it("renders all-time option", () => {
    render(<StandingsPage />);
    expect(screen.getByText("All-Time")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<StandingsPage />);
    expect(screen.getByText(/regular season standings/)).toBeInTheDocument();
  });
});
