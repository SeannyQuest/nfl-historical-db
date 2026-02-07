import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeBettingValue, type BettingGame } from "@/lib/betting-value";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
        bettingLine: true,
      },
      orderBy: { date: "asc" },
    });

    const bettingGames: BettingGame[] = games.map((g) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
      spread: g.bettingLine?.spread ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
    }));

    const result = computeBettingValue(bettingGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/betting-value error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
