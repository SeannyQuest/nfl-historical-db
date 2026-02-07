import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeCbbSeasonSummary,
  computeCbbTournamentSummary,
  type CbbAnalyticsGame,
} from "@/lib/cbb-analytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const includeTournament = searchParams.get("includeTournament") === "true";

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
    const games = await prisma.cbbGame.findMany({
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
    const analyticsGames: CbbAnalyticsGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeConference: g.homeTeam.conference,
      awayConference: g.awayTeam.conference,
      isTournament: g.isTournament,
      tournamentRound: g.tournamentRound,
    }));

    // Compute summaries
    const seasonSummary = computeCbbSeasonSummary(analyticsGames);

    let tournamentSummary = null;
    if (includeTournament) {
      tournamentSummary = computeCbbTournamentSummary(analyticsGames);
    }

    return NextResponse.json({
      success: true,
      sport: "cbb",
      year: yearNum,
      seasonSummary,
      ...(tournamentSummary && { tournamentSummary }),
      totalGames: games.length,
    });
  } catch (err) {
    console.error("GET /api/cbb/analytics error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
