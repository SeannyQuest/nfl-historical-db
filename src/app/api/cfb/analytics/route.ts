import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeCfbSeasonSummary,
  type CfbAnalyticsGame,
} from "@/lib/cfb-analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    if (!year) {
      return NextResponse.json(
        { error: "year query parameter is required" },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return NextResponse.json(
        { error: "year must be a valid number" },
        { status: 400 }
      );
    }

    // Fetch games with relations
    const games = await prisma.cfbGame.findMany({
      where: {
        season: {
          year: yearNum,
        },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
      },
    });

    // Transform to analytics format
    const analyticsGames: CfbAnalyticsGame[] = games.map((g) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeConference: g.homeTeam.conference,
      awayConference: g.awayTeam.conference,
      isPlayoff: g.isPlayoff,
    }));

    // Compute summary
    const summary = computeCfbSeasonSummary(analyticsGames);

    return NextResponse.json({
      success: true,
      sport: "cfb",
      year: yearNum,
      summary,
      totalGames: games.length,
    });
  } catch (err) {
    console.error("GET /api/cfb/analytics error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
