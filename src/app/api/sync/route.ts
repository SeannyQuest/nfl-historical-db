import { NextRequest, NextResponse } from "next/server";
import { getApiUsage } from "@/lib/sportsradar/client";
import { syncNflSchedule, syncNflScores } from "@/lib/sportsradar/sync-nfl";
import { fetchCfbSchedule, fetchCfbScores } from "@/lib/sportsradar/sync-cfb";
import {
  fetchCbbSeasonSchedule,
  fetchCbbDailySchedule,
} from "@/lib/sportsradar/sync-cbb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sport, year, week, date, type } = body as {
      action: string;
      sport?: string;
      year?: number;
      week?: number | string;
      date?: string;
      type?: string;
    };

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    const sportName = sport ?? "nfl";
    const seasonYear = year ?? new Date().getFullYear();
    const seasonType = type ?? "REG";

    // Check usage before making calls
    const usageBefore = await getApiUsage(sportName);
    if (usageBefore.remaining <= 0) {
      return NextResponse.json(
        { error: "API quota exhausted", usage: usageBefore },
        { status: 429 }
      );
    }

    let result;

    if (sportName === "nfl") {
      switch (action) {
        case "schedule":
          result = await syncNflSchedule(seasonYear, seasonType);
          break;

        case "scores":
          if (!week) {
            return NextResponse.json(
              { error: "week is required for scores sync" },
              { status: 400 }
            );
          }
          result = await syncNflScores(seasonYear, seasonType, week);
          break;

        default:
          return NextResponse.json(
            { error: `Unknown action for NFL: ${action}` },
            { status: 400 }
          );
      }
    } else if (sportName === "ncaafb") {
      switch (action) {
        case "schedule":
          const cfbGames = await fetchCfbSchedule(seasonYear, seasonType);
          result = {
            synced: cfbGames.length,
            skipped: 0,
            errors: [],
          };
          break;

        case "scores":
          if (!week) {
            return NextResponse.json(
              { error: "week is required for scores sync" },
              { status: 400 }
            );
          }
          const cfbScores = await fetchCfbScores(seasonYear, seasonType, week);
          result = {
            synced: cfbScores.length,
            skipped: 0,
            errors: [],
          };
          break;

        default:
          return NextResponse.json(
            { error: `Unknown action for NCAAFB: ${action}` },
            { status: 400 }
          );
      }
    } else if (sportName === "ncaamb") {
      switch (action) {
        case "schedule":
          const cbbGames = await fetchCbbSeasonSchedule(seasonYear);
          result = {
            synced: cbbGames.length,
            skipped: 0,
            errors: [],
          };
          break;

        case "daily":
          if (!date) {
            return NextResponse.json(
              { error: "date is required for daily sync" },
              { status: 400 }
            );
          }
          const cbbDaily = await fetchCbbDailySchedule(seasonYear, date);
          result = {
            synced: cbbDaily.length,
            skipped: 0,
            errors: [],
          };
          break;

        default:
          return NextResponse.json(
            { error: `Unknown action for NCAAMB: ${action}` },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: `Unknown sport: ${sportName}` },
        { status: 400 }
      );
    }

    const usageAfter = await getApiUsage(sportName);

    return NextResponse.json({
      success: true,
      action,
      sport: sportName,
      year: seasonYear,
      type: seasonType,
      ...(week !== undefined ? { week } : {}),
      ...(date !== undefined ? { date } : {}),
      result,
      usage: usageAfter,
    });
  } catch (err) {
    console.error("POST /api/sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
