import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-games", () => ({
  usePlayoffStats: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import PlayoffsPage from "@/app/playoffs/page";

afterEach(cleanup);

describe("PlayoffsPage", () => {
  it("renders page title", () => {
    render(<PlayoffsPage />);
    expect(screen.getByText("Playoff History")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<PlayoffsPage />);
    expect(screen.getByText(/Postseason records/)).toBeInTheDocument();
  });
});
