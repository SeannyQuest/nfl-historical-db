import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import Home from "@/app/page";

afterEach(cleanup);

describe("Home page", () => {
  it("renders without throwing", () => {
    expect(() => render(<Home />)).not.toThrow();
  });

  it("displays the app title", () => {
    render(<Home />);
    expect(screen.getByText("GridIron Intel")).toBeInTheDocument();
  });
});
