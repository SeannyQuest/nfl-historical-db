import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { identifyRivalries, type RivalryGame } from "@/lib/rivalry";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
        season: true,
      },
      orderBy: { date: "asc" },
    });

    const rivalryGames: RivalryGame[] = games.map((g) => ({
      date: g.date.toISOString(),
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      homeTeamDivision: g.homeTeam.division ?? null,
      awayTeamDivision: g.awayTeam.division ?? null,
    }));

    const result = identifyRivalries(rivalryGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/rivalries error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
