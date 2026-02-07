import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTrends, type TrendGame } from "@/lib/trends";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        bettingLine: true,
      },
      orderBy: { date: "asc" },
    });

    const trendGames: TrendGame[] = games.map((g) => ({
      season: g.season.year,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isPlayoff: g.isPlayoff,
      primetime: g.primetime,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
    }));

    const trends = computeTrends(trendGames);

    return NextResponse.json({ data: trends });
  } catch (err) {
    console.error("GET /api/trends error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
