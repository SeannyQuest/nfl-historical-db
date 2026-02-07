import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrimetimePage from "@/app/primetime/page";

vi.mock("@/hooks/use-games", () => ({
  usePrimetimeStats: vi.fn(() => ({
    data: {
      data: {
        slots: [],
        bestPrimetimeTeam: null,
        worstPrimetimeTeam: null,
        primetimeVsNonPrimetime: {
          primetime: { avgTotal: "44.5", homeWinPct: "0.560", avgSpread: "3.0" },
          nonPrimetime: { avgTotal: "42.0", homeWinPct: "0.540", avgSpread: "2.8" },
        },
        biggestBlowouts: [],
        upsets: [],
      },
    },
    isLoading: false,
    isError: false,
  })),
}));

describe("PrimetimePage", () => {
  it("renders page title", () => {
    render(<PrimetimePage />);
    expect(screen.getByText("Primetime Performance")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<PrimetimePage />);
    expect(screen.getAllByText(/Comprehensive analysis of NFL primetime games/).length).toBeGreaterThan(0);
  });
});
