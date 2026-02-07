import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeScoringDistribution, type ScoringGame } from "@/lib/scoring-distribution";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
      },
      orderBy: { date: "asc" },
    });

    const scoringGames: ScoringGame[] = games.map((g) => ({
      season: g.season.year,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isPlayoff: g.isPlayoff,
      primetime: g.primetime,
      date: g.date.toISOString().split('T')[0],
    }));

    const analysis = computeScoringDistribution(scoringGames);

    return NextResponse.json({ data: analysis });
  } catch (err) {
    console.error("GET /api/scoring-analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
