import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCloseGames, type CloseGame } from "@/lib/close-games";

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
    const closeGames: CloseGame[] = games.map((g: any) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
      primetime: Boolean(g.primetime),
    }));

    const result = computeCloseGames(closeGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/close-games error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
