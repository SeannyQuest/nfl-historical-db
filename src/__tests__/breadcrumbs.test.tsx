import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Breadcrumbs from "@/components/Breadcrumbs";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("Breadcrumbs", () => {
  it("returns null on home page", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { container } = render(<Breadcrumbs />);
    expect(container.firstChild).toBeNull();
  });

  it("renders breadcrumbs for nested routes", () => {
    vi.mocked(usePathname).mockReturnValue("/teams/analytics");

    render(<Breadcrumbs />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("does not link the last breadcrumb", () => {
    vi.mocked(usePathname).mockReturnValue("/standings/2024");

    render(<Breadcrumbs />);

    const links = screen.getAllByRole("link");
    // Should have Home link + Standings link, but 2024 should not be a link
    expect(links).toHaveLength(2); // Home and Standings
  });

  it("last crumb should be plain text, not a link", () => {
    vi.mocked(usePathname).mockReturnValue("/games/nfl");

    render(<Breadcrumbs />);

    // NFL should not be a link (last crumb is not linked)
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2); // Home and Games

    // But it should exist as text
    const nflSpan = screen.getByText("Nfl");
    expect(nflSpan.tagName).toBe("SPAN");
  });

  it("maps known routes to readable labels", () => {
    vi.mocked(usePathname).mockReturnValue("/cfb/cbb/admin");

    render(<Breadcrumbs />);

    expect(screen.getByText("College Football")).toBeInTheDocument();
    expect(screen.getByText("College Basketball")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("converts unknown routes to title case", () => {
    vi.mocked(usePathname).mockReturnValue("/custom-page/sub-page");

    render(<Breadcrumbs />);

    expect(screen.getByText("Custom Page")).toBeInTheDocument();
    expect(screen.getByText("Sub Page")).toBeInTheDocument();
  });

  it("renders home link", () => {
    vi.mocked(usePathname).mockReturnValue("/teams");

    render(<Breadcrumbs />);

    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("generates correct hrefs for breadcrumbs", () => {
    vi.mocked(usePathname).mockReturnValue("/teams/nfl/schedule");

    render(<Breadcrumbs />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[1]).toHaveAttribute("href", "/teams");
    expect(links[2]).toHaveAttribute("href", "/teams/nfl");
  });

  it("separates breadcrumbs with slash", () => {
    vi.mocked(usePathname).mockReturnValue("/standings/2024");

    const { container } = render(<Breadcrumbs />);
    const separators = container.querySelectorAll(".text-\\[\\#2a3a55\\]");
    expect(separators.length).toBeGreaterThan(0);
  });

  it("renders nav with breadcrumb aria-label", () => {
    vi.mocked(usePathname).mockReturnValue("/games");

    render(<Breadcrumbs />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();
  });
});
