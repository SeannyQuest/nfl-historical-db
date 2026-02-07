import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/use-games", () => ({
  useRecords: () => ({ data: null, isLoading: false, isError: false }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: () => ({ data: null, isLoading: false }),
  };
});

import RecordsPage from "@/app/records/page";

afterEach(cleanup);

describe("RecordsPage", () => {
  it("renders page title", () => {
    render(<RecordsPage />);
    expect(screen.getByText("Record Book")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<RecordsPage />);
    expect(screen.getByText(/All-time NFL records/)).toBeInTheDocument();
  });
});
