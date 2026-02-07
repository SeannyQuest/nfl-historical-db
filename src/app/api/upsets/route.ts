import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeUpsets, type UpsetGame } from "@/lib/upsets";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        bettingLine: true,
      },
      orderBy: { date: "asc" },
    });

    const upsetGames: UpsetGame[] = games.map((g) => ({
      season: g.season.year,
      date: g.date.toISOString(),
      week: g.week,
      isPlayoff: g.isPlayoff,
      primetime: g.primetime,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      spread: g.bettingLine?.spread ?? null,
      playoffRound: g.isPlayoff ? g.week : null,
    }));

    const result = computeUpsets(upsetGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/upsets error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
