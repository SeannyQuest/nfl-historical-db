import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GameFinderPage from "@/app/game-finder/page";

vi.mock("@/components/game-finder", () => ({
  default: () => <div>Game Finder Component</div>,
}));

describe("GameFinderPage", () => {
  it("renders page title", () => {
    render(<GameFinderPage />);
    expect(screen.getByText("Game Finder")).toBeInTheDocument();
  });

  it("renders page description", () => {
    render(<GameFinderPage />);
    expect(screen.getAllByText(/Search and filter NFL games/i).length).toBeGreaterThan(0);
  });

  it("renders game finder component", () => {
    render(<GameFinderPage />);
    expect(screen.getAllByText("Game Finder Component").length).toBeGreaterThan(0);
  });
});
