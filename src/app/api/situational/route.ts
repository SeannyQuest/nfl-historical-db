import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSituational, type SituationalGame } from "@/lib/situational";

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

    const situationalGames: SituationalGame[] = games.map((g) => {
      const dateObj = new Date(g.date);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = days[dateObj.getUTCDay()];

      return {
        season: g.season.year,
        week: g.week,
        homeTeamName: g.homeTeam.name,
        awayTeamName: g.awayTeam.name,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        homeTeamAbbr: g.homeTeam.abbreviation,
        awayTeamAbbr: g.awayTeam.abbreviation,
        dayOfWeek,
      };
    });

    const result = computeSituational(situationalGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/situational error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
