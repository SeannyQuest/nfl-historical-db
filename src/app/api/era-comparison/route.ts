import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEraComparison, type EraGame } from "@/lib/era-comparison";

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

    const eraGames: EraGame[] = games.map((g) => ({
      season: g.season.year,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isPlayoff: g.isPlayoff,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      winnerName: g.winner?.name ?? null,
      spread: g.bettingLine?.spread ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
      overUnder: g.bettingLine?.overUnder ?? null,
    }));

    const result = computeEraComparison(eraGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/era-comparison error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
