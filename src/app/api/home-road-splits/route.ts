import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeHomeRoadSplits, type HomeRoadGame } from "@/lib/home-road-splits";

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

    const mapped: HomeRoadGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isPlayoff: g.isPlayoff,
      primetime: !!g.primetime,
    }));

    const result = computeHomeRoadSplits(mapped);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/home-road-splits error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
