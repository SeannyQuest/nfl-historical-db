import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeAllGames, type GradeGame } from "@/lib/game-grades";

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradeGames: GradeGame[] = games.map((g: any) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
      overtimeIndicator: (g.overtimeIndicator ?? false) as boolean,
    }));

    const result = gradeAllGames(gradeGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/game-grades error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
