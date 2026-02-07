import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SportSwitcher from "@/components/SportSwitcher";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

import { usePathname } from "next/navigation";

describe("SportSwitcher", () => {
  it("renders all three sport options", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<SportSwitcher />);

    expect(screen.getByRole("link", { name: "NFL" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CFB" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CBB" })).toBeInTheDocument();
  });

  it("highlights NFL when on root path", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<SportSwitcher />);
    const nflLink = screen.getByRole("link", { name: "NFL" });

    expect(nflLink).toHaveClass("bg-[#d4af37]", "text-[#0a0f1a]");
  });

  it("highlights CFB when on /cfb path", () => {
    vi.mocked(usePathname).mockReturnValue("/cfb");

    render(<SportSwitcher />);
    const cfbLink = screen.getByRole("link", { name: "CFB" });

    expect(cfbLink).toHaveClass("bg-[#d4af37]", "text-[#0a0f1a]");
  });

  it("highlights CFB when on nested /cfb path", () => {
    vi.mocked(usePathname).mockReturnValue("/cfb/teams/alabama");

    render(<SportSwitcher />);
    const cfbLink = screen.getByRole("link", { name: "CFB" });

    expect(cfbLink).toHaveClass("bg-[#d4af37]", "text-[#0a0f1a]");
  });

  it("highlights CBB when on /cbb path", () => {
    vi.mocked(usePathname).mockReturnValue("/cbb");

    render(<SportSwitcher />);
    const cbbLink = screen.getByRole("link", { name: "CBB" });

    expect(cbbLink).toHaveClass("bg-[#d4af37]", "text-[#0a0f1a]");
  });

  it("highlights CBB when on nested /cbb path", () => {
    vi.mocked(usePathname).mockReturnValue("/cbb/teams/duke");

    render(<SportSwitcher />);
    const cbbLink = screen.getByRole("link", { name: "CBB" });

    expect(cbbLink).toHaveClass("bg-[#d4af37]", "text-[#0a0f1a]");
  });

  it("links to correct sport routes", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<SportSwitcher />);

    const nflLink = screen.getByRole("link", { name: "NFL" });
    const cfbLink = screen.getByRole("link", { name: "CFB" });
    const cbbLink = screen.getByRole("link", { name: "CBB" });

    expect(nflLink).toHaveAttribute("href", "/");
    expect(cfbLink).toHaveAttribute("href", "/cfb");
    expect(cbbLink).toHaveAttribute("href", "/cbb");
  });

  it("non-active sports have correct styling", () => {
    vi.mocked(usePathname).mockReturnValue("/cfb");

    render(<SportSwitcher />);

    const nflLink = screen.getByRole("link", { name: "NFL" });
    const cbbLink = screen.getByRole("link", { name: "CBB" });

    expect(nflLink).toHaveClass("text-[#8899aa]");
    expect(cbbLink).toHaveClass("text-[#8899aa]");
    expect(nflLink).not.toHaveClass("bg-[#d4af37]");
    expect(cbbLink).not.toHaveClass("bg-[#d4af37]");
  });

  it("has correct container styling", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    const { container } = render(<SportSwitcher />);
    const switcher = container.firstChild;

    expect(switcher).toHaveClass(
      "flex",
      "gap-1",
      "rounded-lg",
      "border",
      "border-[#1e2a45]"
    );
  });

  it("all links have rounded and transition classes", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<SportSwitcher />);

    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      expect(link).toHaveClass("rounded-md", "transition-colors");
    });
  });
});
