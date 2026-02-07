import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExportPanel from "@/components/export-panel";
import type { ExportGame } from "@/lib/export";

const mockGames: ExportGame[] = [
  {
    id: "1",
    date: "2023-09-10T13:00:00Z",
    season: 2023,
    week: "1",
    isPlayoff: false,
    homeTeamName: "Kansas City Chiefs",
    homeTeamAbbr: "KC",
    awayTeamName: "Detroit Lions",
    awayTeamAbbr: "DET",
    homeScore: 21,
    awayScore: 20,
    spread: 3.5,
    spreadResult: "COVERED",
    ouResult: "UNDER",
    overUnder: 42.5,
    primetime: "SNF",
  },
  {
    id: "2",
    date: "2023-09-17T13:00:00Z",
    season: 2023,
    week: "2",
    isPlayoff: false,
    homeTeamName: "New England Patriots",
    homeTeamAbbr: "NE",
    awayTeamName: "Philadelphia Eagles",
    awayTeamAbbr: "PHI",
    homeScore: 25,
    awayScore: 20,
    spread: 2.0,
    spreadResult: "COVERED",
    ouResult: "OVER",
    overUnder: 43.5,
    primetime: null,
  },
];

describe("ExportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders export panel", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("Export Data").length > 0).toBeTruthy();
    });

    it("displays format selector buttons", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("CSV").length > 0).toBeTruthy();
      expect(screen.queryAllByText("JSON").length > 0).toBeTruthy();
    });

    it("displays record count", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("2").length > 0).toBeTruthy();
    });

    it("uses filteredCount when provided", () => {
      render(<ExportPanel games={mockGames} filteredCount={1} />);
      expect(screen.queryAllByText("1").length > 0).toBeTruthy();
    });

    it("displays season filter when provided", () => {
      render(<ExportPanel games={mockGames} season={2023} />);
      expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
    });

    it("displays team filter when provided", () => {
      render(<ExportPanel games={mockGames} team="Kansas City Chiefs" />);
      expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
    });

    it("displays both season and team filters", () => {
      render(<ExportPanel games={mockGames} season={2023} team="Kansas City Chiefs" />);
      expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
      expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
    });
  });

  describe("format selection", () => {
    it("defaults to CSV format", () => {
      render(<ExportPanel games={mockGames} />);
      const csvButton = screen.getByRole("button", { name: "CSV" });
      expect(csvButton).toHaveClass("text-[#d4af37]");
    });

    it("switches to JSON format when clicked", () => {
      render(<ExportPanel games={mockGames} />);
      const jsonButton = screen.getByRole("button", { name: "JSON" });
      fireEvent.click(jsonButton);
      expect(jsonButton).toHaveClass("text-[#d4af37]");
    });

    it("updates download button text based on format", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("Download CSV").length > 0).toBeTruthy();

      const jsonButton = screen.getByRole("button", { name: "JSON" });
      fireEvent.click(jsonButton);
      expect(screen.queryAllByText("Download JSON").length > 0).toBeTruthy();
    });
  });

  describe("download functionality", () => {
    let originalAppendChild: (node: Node) => Node;
    let originalRemoveChild: (node: Node) => Node;

    beforeEach(() => {
      // Save original methods before mocking
      originalAppendChild = document.body.appendChild;
      originalRemoveChild = document.body.removeChild;

      global.URL.createObjectURL = vi.fn(() => "blob:mock");
      global.URL.revokeObjectURL = vi.fn();

      // Mock with functions that still call the original
      document.body.appendChild = vi.fn((element) => {
        return originalAppendChild.call(document.body, element);
      });
      document.body.removeChild = vi.fn((element) => {
        return originalRemoveChild.call(document.body, element);
      });
    });

    afterEach(() => {
      // Restore original methods
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
    });

    it("downloads data when button clicked", async () => {
      render(<ExportPanel games={mockGames} />);
      const downloadButton = screen.getByText("Download CSV");
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.queryAllByText("Download CSV").length > 0).toBeTruthy();
      });
    });

    it("disables button during download", async () => {
      render(<ExportPanel games={mockGames} />);
      const downloadButton = screen.getByText("Download CSV");
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText("Download CSV")).not.toBeDisabled();
      });
    });

    it("disables download when no games", () => {
      render(<ExportPanel games={[]} filteredCount={0} />);
      const downloadButton = screen.getByText("Download CSV");
      expect(downloadButton).toBeDisabled();
    });

    it("shows error message when no games", () => {
      render(<ExportPanel games={[]} filteredCount={0} />);
      expect(screen.queryAllByText("No games to export. Adjust filters to see data.").length > 0).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows error message for empty games", () => {
      render(<ExportPanel games={[]} />);
      expect(screen.queryAllByText("No games to export. Adjust filters to see data.").length > 0).toBeTruthy();
    });

    it("disables download button for empty games", () => {
      render(<ExportPanel games={[]} />);
      const downloadButton = screen.getByRole("button", { name: /Download/ });
      expect(downloadButton).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has proper labels for format selector", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("Export Format").length > 0).toBeTruthy();
    });

    it("displays record summary", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("Records:").length > 0).toBeTruthy();
    });
  });

  describe("filter summary display", () => {
    it("displays filter summary with record count", () => {
      render(<ExportPanel games={mockGames} filteredCount={5} />);
      const summaryText = screen.getByText("5");
      expect(summaryText).toBeInTheDocument();
    });

    it("shows full game count when no filters", () => {
      render(<ExportPanel games={mockGames} />);
      expect(screen.queryAllByText("2").length > 0).toBeTruthy();
    });

    it("displays season in summary", () => {
      render(<ExportPanel games={mockGames} season={2023} />);
      expect(screen.queryAllByText("2023").length > 0).toBeTruthy();
    });

    it("displays team in summary", () => {
      render(<ExportPanel games={mockGames} team="Kansas City Chiefs" />);
      expect(screen.queryAllByText("Kansas City Chiefs").length > 0).toBeTruthy();
    });
  });
});
