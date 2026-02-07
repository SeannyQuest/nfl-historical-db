import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import ScheduleDashboard from "@/components/schedule-dashboard";
import type { ScheduleResult } from "@/lib/schedule";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

const noop = () => {};

const sampleSchedule: ScheduleResult = {
  weeks: [
    {
      season: 2024,
      week: "1",
      weekLabel: "Week 1",
      games: [
        {
          game: {
            id: "g1",
            date: "2024-09-05T12:00:00.000Z",
            season: 2024,
            week: "1",
            time: "8:20 PM",
            dayOfWeek: "Thu",
            isPlayoff: false,
            primetime: "TNF",
            homeTeamName: "Kansas City Chiefs",
            homeTeamAbbr: "KC",
            homeTeamCity: "Kansas City",
            awayTeamName: "Baltimore Ravens",
            awayTeamAbbr: "BAL",
            awayTeamCity: "Baltimore",
            homeScore: 27,
            awayScore: 20,
            winnerName: "Kansas City Chiefs",
            spread: -3,
            overUnder: 46.5,
            spreadResult: "COVERED",
            ouResult: "OVER",
          },
          homeRecord: "1-0",
          awayRecord: "0-1",
          statusLabel: "Final",
        },
        {
          game: {
            id: "g2",
            date: "2024-09-08T12:00:00.000Z",
            season: 2024,
            week: "1",
            time: "1:00 PM",
            dayOfWeek: "Sun",
            isPlayoff: false,
            primetime: null,
            homeTeamName: "Dallas Cowboys",
            homeTeamAbbr: "DAL",
            homeTeamCity: "Dallas",
            awayTeamName: "Cleveland Browns",
            awayTeamAbbr: "CLE",
            awayTeamCity: "Cleveland",
            homeScore: 33,
            awayScore: 17,
            winnerName: "Dallas Cowboys",
            spread: -5.5,
            overUnder: 44,
            spreadResult: "COVERED",
            ouResult: "OVER",
          },
          homeRecord: "1-0",
          awayRecord: "0-1",
          statusLabel: "Final",
        },
      ],
    },
    {
      season: 2024,
      week: "2",
      weekLabel: "Week 2",
      games: [
        {
          game: {
            id: "g3",
            date: "2024-09-15T12:00:00.000Z",
            season: 2024,
            week: "2",
            time: "4:25 PM",
            dayOfWeek: "Sun",
            isPlayoff: false,
            primetime: null,
            homeTeamName: "Buffalo Bills",
            homeTeamAbbr: "BUF",
            homeTeamCity: "Buffalo",
            awayTeamName: "Miami Dolphins",
            awayTeamAbbr: "MIA",
            awayTeamCity: "Miami",
            homeScore: 0,
            awayScore: 0,
            winnerName: null,
            spread: -3,
            overUnder: 48,
            spreadResult: null,
            ouResult: null,
          },
          homeRecord: "1-0",
          awayRecord: "1-0",
          statusLabel: "4:25 PM ET",
        },
      ],
    },
  ],
  availableSeasons: [2024, 2023],
  availableWeeks: ["1", "2"],
};

describe("ScheduleDashboard", () => {
  // ─── Loading/Error states ─────────────────────────────
  it("shows loading state", () => {
    render(
      <ScheduleDashboard
        schedule={null}
        isLoading={true}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("Loading schedule...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <ScheduleDashboard
        schedule={null}
        isLoading={false}
        isError={true}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("Failed to load schedule.")).toBeInTheDocument();
  });

  it("renders nothing when no schedule and not loading/error", () => {
    const { container } = render(
      <ScheduleDashboard
        schedule={null}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  // ─── Filters ──────────────────────────────────────────
  it("renders season dropdown", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    const select = screen.getByDisplayValue("All Seasons");
    expect(select).toBeInTheDocument();
  });

  it("calls onSeasonChange when season selected", () => {
    const onSeasonChange = vi.fn();
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={onSeasonChange}
        onWeekChange={noop}
      />
    );
    fireEvent.change(screen.getByDisplayValue("All Seasons"), {
      target: { value: "2024" },
    });
    expect(onSeasonChange).toHaveBeenCalledWith("2024");
  });

  it("shows week dropdown when season is selected", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season="2024"
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByDisplayValue("All Weeks")).toBeInTheDocument();
  });

  it("hides week dropdown when no season selected", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.queryByDisplayValue("All Weeks")).not.toBeInTheDocument();
  });

  it("shows clear button when season is set", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season="2024"
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  // ─── Week sections ────────────────────────────────────
  it("renders week headers", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(screen.getByText("Week 2")).toBeInTheDocument();
  });

  it("shows game count", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("3 games")).toBeInTheDocument();
  });

  // ─── Scorebug cards ──────────────────────────────────
  it("renders team abbreviations", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("KC")).toBeInTheDocument();
    expect(screen.getByText("BAL")).toBeInTheDocument();
    expect(screen.getByText("DAL")).toBeInTheDocument();
    expect(screen.getByText("CLE")).toBeInTheDocument();
  });

  it("shows scores for completed games", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getAllByText("20").length).toBeGreaterThanOrEqual(1);
  });

  it("shows team records", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getAllByText("(1-0)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("(0-1)").length).toBeGreaterThanOrEqual(1);
  });

  it("shows status label for completed games", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getAllByText("Final").length).toBeGreaterThanOrEqual(1);
  });

  it("shows time for upcoming games", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("4:25 PM ET")).toBeInTheDocument();
  });

  it("shows primetime badge", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("TNF")).toBeInTheDocument();
  });

  it("shows spread in betting footer", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("Spread: KC -3")).toBeInTheDocument();
  });

  it("shows over/under in betting footer", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("O/U: 46.5")).toBeInTheDocument();
  });

  it("groups games by day within week", () => {
    render(
      <ScheduleDashboard
        schedule={sampleSchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText(/Thursday/)).toBeInTheDocument();
    expect(screen.getAllByText(/Sunday/).length).toBeGreaterThanOrEqual(1);
  });

  // ─── Empty state ──────────────────────────────────────
  it("shows no games message for empty schedule", () => {
    const emptySchedule: ScheduleResult = {
      weeks: [],
      availableSeasons: [2024],
      availableWeeks: [],
    };
    render(
      <ScheduleDashboard
        schedule={emptySchedule}
        isLoading={false}
        isError={false}
        season={null}
        week={null}
        onSeasonChange={noop}
        onWeekChange={noop}
      />
    );
    expect(screen.getByText("No games found")).toBeInTheDocument();
  });
});
