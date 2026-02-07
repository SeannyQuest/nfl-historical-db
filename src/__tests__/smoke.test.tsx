import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

// Mock the hooks so Dashboard renders without real API calls
vi.mock("@/hooks/use-games", () => ({
  useGames: () => ({ data: null, isLoading: true }),
  useTeams: () => ({ data: null }),
  useSeasons: () => ({ data: null }),
}));

// Mock TanStack Query provider
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: true }),
  };
});

import Home from "@/app/page";

afterEach(cleanup);

describe("Home page", () => {
  it("renders without throwing", () => {
    expect(() => render(<Home />)).not.toThrow();
  });
});
