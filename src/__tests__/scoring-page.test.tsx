import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/hooks/use-games", () => ({
  useScoringAnalysis: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import ScoringPage from "@/app/scoring/page";

afterEach(cleanup);

describe("ScoringPage", () => {
  it("renders page title", () => {
    render(<ScoringPage />);
    expect(screen.getByText("Scoring Analysis")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<ScoringPage />);
    expect(screen.getByText(/Distribution analysis/)).toBeInTheDocument();
  });
});
