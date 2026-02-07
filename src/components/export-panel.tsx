"use client";

import { useState } from "react";
import { generateFilename, formatGamesCSV, formatGamesJSON, type ExportGame } from "@/lib/export";

interface ExportPanelProps {
  games: ExportGame[];
  filteredCount?: number;
  season?: number;
  team?: string;
}

export default function ExportPanel({ games, filteredCount = 0, season, team }: ExportPanelProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      let content: string;
      if (format === "csv") {
        content = formatGamesCSV(games);
      } else {
        content = formatGamesJSON(games);
      }

      const filename = generateFilename("games", { season, team, format });
      const blob = new Blob([content], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const displayCount = filteredCount > 0 ? filteredCount : games.length;

  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d]">
      <div className="border-b border-[#1e2a45] px-5 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5a6a7a]">Export Data</h3>
      </div>
      <div className="space-y-4 px-5 py-4">
        {/* Format selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[#8899aa]">Export Format</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat("csv")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                format === "csv"
                  ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                  : "border-[#1e2a45] bg-[#1e2a45]/50 text-[#8899aa] hover:border-[#2a3a55]"
              }`}
            >
              CSV
            </button>
            <button
              onClick={() => setFormat("json")}
              className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                format === "json"
                  ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                  : "border-[#1e2a45] bg-[#1e2a45]/50 text-[#8899aa] hover:border-[#2a3a55]"
              }`}
            >
              JSON
            </button>
          </div>
        </div>

        {/* Filter summary */}
        <div className="rounded bg-[#1e2a45]/30 px-3 py-2">
          <p className="text-xs text-[#5a6a7a]">
            <span className="font-medium">Records:</span> <span className="text-[#d4af37]">{displayCount}</span>
          </p>
          {season && (
            <p className="text-xs text-[#5a6a7a]">
              <span className="font-medium">Season:</span> <span className="text-[#e0e0e0]">{season}</span>
            </p>
          )}
          {team && (
            <p className="text-xs text-[#5a6a7a]">
              <span className="font-medium">Team:</span> <span className="text-[#e0e0e0]">{team}</span>
            </p>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading || displayCount === 0}
          className={`w-full rounded border px-4 py-2 text-sm font-medium transition-colors ${
            isDownloading || displayCount === 0
              ? "border-[#2a3a55] text-[#5a6a7a]"
              : "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/20"
          }`}
        >
          {isDownloading ? "Downloading..." : `Download ${format.toUpperCase()}`}
        </button>

        {displayCount === 0 && (
          <p className="text-xs text-[#ef4444]">No games to export. Adjust filters to see data.</p>
        )}
      </div>
    </div>
  );
}
