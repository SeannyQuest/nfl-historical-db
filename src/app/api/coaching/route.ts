import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCoachingStats, type CoachingGame } from "@/lib/coaching";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: "asc" },
    });

    const coachingGames: CoachingGame[] = games.map((g) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
    }));

    const result = computeCoachingStats(coachingGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/coaching error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
