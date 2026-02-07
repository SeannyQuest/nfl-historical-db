import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMomentumTracker, type MomentumGame } from "@/lib/momentum";

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

    const mappedGames: MomentumGame[] = games.map((g) => ({
      season: g.season.year,
      week: parseInt(g.week, 10),
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
    }));

    const result = computeMomentumTracker(mappedGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/momentum error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
