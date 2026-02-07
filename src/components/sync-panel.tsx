"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────

interface ApiUsageData {
  used: number;
  quota: number;
  remaining: number;
  warning: boolean;
}

interface AllUsage {
  nfl: ApiUsageData;
  ncaafb: ApiUsageData;
  ncaamb: ApiUsageData;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

interface SyncResponse {
  success: boolean;
  action: string;
  year: number;
  type: string;
  week?: number | string;
  result: SyncResult;
  usage: ApiUsageData;
}

interface LogEntry {
  id: number;
  time: string;
  action: string;
  message: string;
  isError: boolean;
}

export interface SyncPanelProps {
  initialUsage: AllUsage | null;
  isLoading: boolean;
  isError: boolean;
}

// ─── Usage bar ───────────────────────────────────────────

function UsageBar({ label, usage }: { label: string; usage: ApiUsageData }) {
  const pct = Math.min(100, (usage.used / usage.quota) * 100);
  const barColor = usage.warning
    ? pct >= 100
      ? "bg-red-500"
      : "bg-[#f59e0b]"
    : "bg-[#22c55e]";

  return (
    <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[#ccddeeff]">{label}</span>
        <span className="text-xs text-[#8899aa]">
          {usage.used} / {usage.quota}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#0a0f1a]">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-[#5a6a7a]">{usage.remaining} remaining</span>
        {usage.warning && (
          <span className="text-xs font-medium text-[#f59e0b]">⚠ High usage</span>
        )}
      </div>
    </div>
  );
}

// ─── Sync Panel ──────────────────────────────────────────

export default function SyncPanel({
  initialUsage,
  isLoading,
  isError,
}: SyncPanelProps) {
  const [usage, setUsage] = useState<AllUsage | null>(initialUsage);
  const [year, setYear] = useState(new Date().getFullYear());
  const [week, setWeek] = useState(1);
  const [type, setType] = useState("REG");
  const [syncing, setSyncing] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  let nextId = 0;

  // Refresh usage data
  async function refreshUsage() {
    try {
      const res = await fetch("/api/api-usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch {
      // silent
    }
  }

  function addLog(action: string, message: string, isError = false) {
    const entry: LogEntry = {
      id: ++nextId,
      time: new Date().toLocaleTimeString(),
      action,
      message,
      isError,
    };
    setLog((prev) => [entry, ...prev].slice(0, 20));
  }

  async function handleSync(action: string) {
    setSyncing(true);
    try {
      const body: Record<string, unknown> = { action, year, type };
      if (action === "scores") body.week = week;

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as SyncResponse & { error?: string };

      if (!res.ok) {
        addLog(action, data.error ?? `Error ${res.status}`, true);
        return;
      }

      const { result } = data;
      const msg = `Synced ${result.synced}, skipped ${result.skipped}${
        result.errors.length > 0 ? `, ${result.errors.length} errors` : ""
      }`;
      addLog(action, msg);

      if (result.errors.length > 0) {
        for (const err of result.errors.slice(0, 5)) {
          addLog(action, err, true);
        }
      }

      // Update usage from response
      if (data.usage) {
        setUsage((prev) => (prev ? { ...prev, nfl: data.usage } : prev));
      }
    } catch (err) {
      addLog(
        action,
        err instanceof Error ? err.message : "Request failed",
        true
      );
    } finally {
      setSyncing(false);
      await refreshUsage();
    }
  }

  // ─── Loading / Error states ──────────────────────────

  if (isLoading) {
    return (
      <div className="py-12 text-center text-[#8899aa]">
        Loading API usage...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center text-red-400">
        Failed to load API usage data.
      </div>
    );
  }

  if (!usage) return null;

  // ─── Years for selector ──────────────────────────────

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Usage bars */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">
          API Usage (30-Day Window)
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <UsageBar label="NFL" usage={usage.nfl} />
          <UsageBar label="College Football" usage={usage.ncaafb} />
          <UsageBar label="College Basketball" usage={usage.ncaamb} />
        </div>
      </div>

      {/* Sync controls */}
      <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
        <h2 className="mb-4 text-lg font-semibold text-[#f0f0f0]">
          NFL Sync Controls
        </h2>

        {/* Selectors */}
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-xs text-[#8899aa]">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded border border-[#2a3a55] bg-[#0a0f1a] px-3 py-1.5 text-sm text-[#f0f0f0]"
              disabled={syncing}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#8899aa]">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded border border-[#2a3a55] bg-[#0a0f1a] px-3 py-1.5 text-sm text-[#f0f0f0]"
              disabled={syncing}
            >
              <option value="REG">Regular Season</option>
              <option value="PST">Postseason</option>
              <option value="PRE">Preseason</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#8899aa]">Week</label>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="rounded border border-[#2a3a55] bg-[#0a0f1a] px-3 py-1.5 text-sm text-[#f0f0f0]"
              disabled={syncing}
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSync("schedule")}
            disabled={syncing || usage.nfl.remaining <= 0}
            className="rounded border border-[#d4af37] bg-[#d4af37]/10 px-4 py-2 text-sm font-medium text-[#d4af37] transition-colors hover:bg-[#d4af37]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {syncing ? "Syncing..." : "Sync Schedule"}
          </button>

          <button
            onClick={() => handleSync("scores")}
            disabled={syncing || usage.nfl.remaining <= 0}
            className="rounded border border-[#22c55e] bg-[#22c55e]/10 px-4 py-2 text-sm font-medium text-[#22c55e] transition-colors hover:bg-[#22c55e]/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {syncing ? "Syncing..." : "Sync Scores"}
          </button>

          <button
            onClick={refreshUsage}
            disabled={syncing}
            className="rounded border border-[#2a3a55] px-4 py-2 text-sm text-[#8899aa] transition-colors hover:border-[#5a6a7a] hover:text-[#ccc] disabled:opacity-40"
          >
            Refresh Usage
          </button>
        </div>
      </div>

      {/* Sync log */}
      {log.length > 0 && (
        <div className="rounded-lg border border-[#1e2a45] bg-[#141b2d] p-4">
          <h2 className="mb-3 text-lg font-semibold text-[#f0f0f0]">
            Sync Log
          </h2>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {log.map((entry) => (
              <div
                key={entry.id}
                className={`flex gap-3 text-xs ${
                  entry.isError ? "text-red-400" : "text-[#8899aa]"
                }`}
              >
                <span className="shrink-0 text-[#5a6a7a]">{entry.time}</span>
                <span className="shrink-0 font-medium text-[#d4af37]">
                  [{entry.action}]
                </span>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
