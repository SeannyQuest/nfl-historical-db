import { NextRequest, NextResponse } from "next/server";
import { getApiUsage } from "@/lib/sportsradar/client";
import { syncNflSchedule, syncNflScores } from "@/lib/sportsradar/sync-nfl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, year, week, type } = body as {
      action: string;
      year?: number;
      week?: number | string;
      type?: string;
    };

    if (!action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 }
      );
    }

    const seasonYear = year ?? new Date().getFullYear();
    const seasonType = type ?? "REG";

    // Check usage before making calls
    const usageBefore = await getApiUsage("nfl");
    if (usageBefore.remaining <= 0) {
      return NextResponse.json(
        { error: "API quota exhausted", usage: usageBefore },
        { status: 429 }
      );
    }

    let result;

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
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    const usageAfter = await getApiUsage("nfl");

    return NextResponse.json({
      success: true,
      action,
      year: seasonYear,
      type: seasonType,
      ...(week !== undefined ? { week } : {}),
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
