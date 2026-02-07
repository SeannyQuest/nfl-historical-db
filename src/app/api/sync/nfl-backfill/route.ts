import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncNflSchedule, syncNflScores } from "@/lib/sportsradar/sync-nfl";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, type } = body as {
      year?: number;
      type?: string;
    };

    const seasonYear = year ?? new Date().getFullYear();
    const seasonType = type ?? "REG";

    // First sync the schedule
    const scheduleResult = await syncNflSchedule(seasonYear, seasonType);

    // Then sync scores for all weeks to populate quarter and turnover data
    const weeks = Array.from(
      { length: seasonType === "REG" ? 18 : 4 },
      (_, i) => i + 1
    );
    const scoresResults = [];

    for (const week of weeks) {
      try {
        const scoresResult = await syncNflScores(seasonYear, seasonType, week);
        scoresResults.push({
          week,
          ...scoresResult,
        });
      } catch (err) {
        scoresResults.push({
          week,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Get updated games to check for quarter/turnover data
    const season = await prisma.season.findUnique({
      where: { year: seasonYear },
    });

    let gamesWithQuarters = 0;
    let gamesWithTurnovers = 0;

    if (season) {
      const games = await prisma.game.findMany({
        where: { seasonId: season.id },
      });

      gamesWithQuarters = games.filter((g) => g.homeQ1 !== null).length;
      gamesWithTurnovers = games.filter((g) => g.homeFumbles !== null).length;
    }

    return NextResponse.json({
      success: true,
      sport: "nfl",
      year: seasonYear,
      type: seasonType,
      scheduleResult,
      scoresResults,
      dataQuality: {
        gamesWithQuarters,
        gamesWithTurnovers,
      },
    });
  } catch (err) {
    console.error("POST /api/sync/nfl-backfill error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
