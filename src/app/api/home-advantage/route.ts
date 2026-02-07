import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHomeAdvantage, type HomeAdvantageGame } from "@/lib/home-advantage";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
        bettingLine: true,
        weather: true,
      },
      orderBy: { date: "asc" },
    });

    const haGames: HomeAdvantageGame[] = games.map((g) => {
      const dateObj = new Date(g.date);
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = days[dateObj.getUTCDay()];

      return {
        season: g.season.year,
        date: g.date.toISOString(),
        dayOfWeek,
        isPlayoff: g.isPlayoff,
        primetime: g.primetime,
        homeTeamName: g.homeTeam.name,
        awayTeamName: g.awayTeam.name,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        conditions: g.weather?.conditions ?? null,
        spread: g.bettingLine?.spread ?? null,
        spreadResult: g.bettingLine?.spreadResult ?? null,
      };
    });

    const result = computeHomeAdvantage(haGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/home-advantage error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
