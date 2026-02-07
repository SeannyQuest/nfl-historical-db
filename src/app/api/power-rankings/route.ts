import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePowerRankings, type PRGame } from "@/lib/power-rankings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season");

    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: "asc" },
    });

    const prGames: PRGame[] = games.map((g) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
    }));

    const targetSeason = season ? parseInt(season, 10) : Math.max(...prGames.map((g) => g.season));
    const result = computePowerRankings(prGames, targetSeason);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/power-rankings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
