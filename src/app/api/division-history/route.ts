import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDivisionHistory, type DivisionGame } from "@/lib/division-history";

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

    const divisionGames: DivisionGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      homeTeamDivision: g.homeTeam.division,
      awayTeamName: g.awayTeam.name,
      awayTeamDivision: g.awayTeam.division,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      isPlayoff: g.isPlayoff,
    }));

    const result = computeDivisionHistory(divisionGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/division-history error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
