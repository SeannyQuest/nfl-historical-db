import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("@/hooks/use-games", () => ({
  useTrends: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import TrendsPage from "@/app/trends/page";

afterEach(cleanup);

describe("TrendsPage", () => {
  it("renders page title", () => {
    render(<TrendsPage />);
    expect(screen.getByText("League Trends")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<TrendsPage />);
    expect(screen.getByText(/Historical scoring/)).toBeInTheDocument();
  });
});
