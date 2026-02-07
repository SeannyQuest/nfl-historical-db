import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSuperBowlStats, type SuperBowlGame } from "@/lib/super-bowl";

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

    const sbGames: SuperBowlGame[] = games
      .filter((g) => g.week === "SuperBowl")
      .map((g) => ({
        season: g.season.year,
        week: g.week,
        homeTeamName: g.homeTeam.name,
        awayTeamName: g.awayTeam.name,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        homeTeamAbbr: g.homeTeam.abbreviation,
        awayTeamAbbr: g.awayTeam.abbreviation,
        spreadResult: g.bettingLine?.spreadResult ?? null,
        ouResult: g.bettingLine?.ouResult ?? null,
      }));

    const result = computeSuperBowlStats(sbGames);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/super-bowl error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
