import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import SyncPanel from "@/components/sync-panel";
import type { SyncPanelProps } from "@/components/sync-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const sampleUsage: SyncPanelProps["initialUsage"] = {
  nfl: { used: 50, quota: 1000, remaining: 950, warning: false },
  ncaafb: { used: 0, quota: 1000, remaining: 1000, warning: false },
  ncaamb: { used: 0, quota: 1000, remaining: 1000, warning: false },
};

const warningUsage: SyncPanelProps["initialUsage"] = {
  nfl: { used: 850, quota: 1000, remaining: 150, warning: true },
  ncaafb: { used: 0, quota: 1000, remaining: 1000, warning: false },
  ncaamb: { used: 0, quota: 1000, remaining: 1000, warning: false },
};

const exhaustedUsage: SyncPanelProps["initialUsage"] = {
  nfl: { used: 1000, quota: 1000, remaining: 0, warning: true },
  ncaafb: { used: 0, quota: 1000, remaining: 1000, warning: false },
  ncaamb: { used: 0, quota: 1000, remaining: 1000, warning: false },
};

// ─── Loading / Error states ─────────────────────────────

describe("SyncPanel", () => {
  it("shows loading state", () => {
    render(
      <SyncPanel initialUsage={null} isLoading={true} isError={false} />
    );
    expect(screen.getByText("Loading API usage...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <SyncPanel initialUsage={null} isLoading={false} isError={true} />
    );
    expect(
      screen.getByText("Failed to load API usage data.")
    ).toBeInTheDocument();
  });

  it("renders nothing when no data and not loading/error", () => {
    const { container } = render(
      <SyncPanel initialUsage={null} isLoading={false} isError={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  // ─── Usage bars ─────────────────────────────────────

  it("shows NFL usage bar", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("NFL")).toBeInTheDocument();
    expect(screen.getByText("50 / 1000")).toBeInTheDocument();
    expect(screen.getByText("950 remaining")).toBeInTheDocument();
  });

  it("shows all three sport usage bars", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("NFL")).toBeInTheDocument();
    expect(screen.getByText("College Football")).toBeInTheDocument();
    expect(screen.getByText("College Basketball")).toBeInTheDocument();
  });

  it("shows warning indicator when usage is high", () => {
    render(
      <SyncPanel
        initialUsage={warningUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("⚠ High usage")).toBeInTheDocument();
  });

  // ─── Sync controls ─────────────────────────────────

  it("renders sync buttons", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Sync Schedule")).toBeInTheDocument();
    expect(screen.getByText("Sync Scores")).toBeInTheDocument();
    expect(screen.getByText("Refresh Usage")).toBeInTheDocument();
  });

  it("disables sync buttons when quota exhausted", () => {
    render(
      <SyncPanel
        initialUsage={exhaustedUsage}
        isLoading={false}
        isError={false}
      />
    );
    const scheduleBtn = screen.getByText("Sync Schedule");
    const scoresBtn = screen.getByText("Sync Scores");
    expect(scheduleBtn).toBeDisabled();
    expect(scoresBtn).toBeDisabled();
  });

  it("renders year selector", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Year")).toBeInTheDocument();
  });

  it("renders type selector with all options", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Regular Season")).toBeInTheDocument();
  });

  it("renders week selector", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("Week")).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
  });

  // ─── Section headings ──────────────────────────────

  it("shows usage heading", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(
      screen.getByText("API Usage (30-Day Window)")
    ).toBeInTheDocument();
  });

  it("shows sync controls heading", () => {
    render(
      <SyncPanel
        initialUsage={sampleUsage}
        isLoading={false}
        isError={false}
      />
    );
    expect(screen.getByText("NFL Sync Controls")).toBeInTheDocument();
  });
});
