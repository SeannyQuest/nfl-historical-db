import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePrimetimeStats, type PrimetimeGame } from "@/lib/primetime-stats";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
        season: true,
        bettingLine: true,
      },
      orderBy: { date: "asc" },
    });

    const primetimeGames: PrimetimeGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      primetime: g.primetime,
      isPlayoff: g.isPlayoff,
      spread: g.bettingLine?.spread ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
    }));

    const result = computePrimetimeStats(primetimeGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/primetime error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
