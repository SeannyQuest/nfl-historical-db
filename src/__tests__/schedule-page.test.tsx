import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-games", () => ({
  useSchedule: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import SchedulePage from "@/app/schedule/page";

afterEach(cleanup);

describe("SchedulePage", () => {
  it("renders page title", () => {
    render(<SchedulePage />);
    expect(screen.getByText("Schedule")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<SchedulePage />);
    expect(screen.getByText(/Weekly scoreboard/)).toBeInTheDocument();
  });
});
