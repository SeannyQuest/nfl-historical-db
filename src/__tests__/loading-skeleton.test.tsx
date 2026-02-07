import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  StatCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  ChartSkeleton,
  PageSkeleton,
} from "@/components/LoadingSkeleton";

describe("LoadingSkeleton components", () => {
  describe("StatCardSkeleton", () => {
    it("renders with animation", () => {
      const { container } = render(<StatCardSkeleton />);
      const div = container.querySelector(".animate-pulse");
      expect(div).toBeInTheDocument();
      expect(div).toHaveClass("rounded-lg", "border", "bg-[#141b2d]");
    });

    it("has correct styling classes", () => {
      const { container } = render(<StatCardSkeleton />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass("rounded-lg", "border-[#1e2a45]");
    });
  });

  describe("TableRowSkeleton", () => {
    it("renders default 5 columns", () => {
      const { container } = render(<TableRowSkeleton />);
      const cells = container.querySelectorAll("td");
      expect(cells).toHaveLength(5);
    });

    it("renders custom number of columns", () => {
      const { container } = render(<TableRowSkeleton columns={3} />);
      const cells = container.querySelectorAll("td");
      expect(cells).toHaveLength(3);
    });

    it("has animate-pulse class on row", () => {
      const { container } = render(<TableRowSkeleton />);
      const row = container.querySelector("tr");
      expect(row).toHaveClass("animate-pulse");
    });
  });

  describe("TableSkeleton", () => {
    it("renders default 5 rows and 5 columns", () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(5);
      const headerCells = container.querySelectorAll("thead th");
      expect(headerCells).toHaveLength(5);
    });

    it("renders custom number of rows and columns", () => {
      const { container } = render(<TableSkeleton rows={3} columns={4} />);
      const rows = container.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(3);
      const headerCells = container.querySelectorAll("thead th");
      expect(headerCells).toHaveLength(4);
    });

    it("has correct border and background styling", () => {
      const { container } = render(<TableSkeleton />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass(
        "overflow-hidden",
        "rounded-lg",
        "border",
        "border-[#1e2a45]"
      );
    });

    it("has table with correct structure", () => {
      const { container } = render(<TableSkeleton />);
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
      expect(table?.querySelector("thead")).toBeInTheDocument();
      expect(table?.querySelector("tbody")).toBeInTheDocument();
    });
  });

  describe("ChartSkeleton", () => {
    it("renders with animation and styling", () => {
      const { container } = render(<ChartSkeleton />);
      const div = container.querySelector(".animate-pulse");
      expect(div).toBeInTheDocument();
      expect(div).toHaveClass("rounded-lg", "border-[#1e2a45]");
    });

    it("has title and content placeholders", () => {
      const { container } = render(<ChartSkeleton />);
      const placeholders = container.querySelectorAll("[class*='h-']");
      expect(placeholders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PageSkeleton", () => {
    it("renders all sections", () => {
      const { container } = render(<PageSkeleton />);
      const mainDiv = container.querySelector(".space-y-6");
      expect(mainDiv).toBeInTheDocument();
    });

    it("renders title skeleton", () => {
      const { container } = render(<PageSkeleton />);
      const titleDiv = container.querySelector(".h-8");
      expect(titleDiv).toBeInTheDocument();
      expect(titleDiv).toHaveClass("animate-pulse");
    });

    it("renders 4 stat card skeletons in grid", () => {
      const { container } = render(<PageSkeleton />);
      const statCards = container.querySelectorAll(".grid .animate-pulse");
      expect(statCards.length).toBeGreaterThanOrEqual(4);
    });

    it("renders table skeleton", () => {
      const { container } = render(<PageSkeleton />);
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });
  });
});
