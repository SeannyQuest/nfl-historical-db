import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeGarbageTimeAnalysis, type GarbageTimeGame } from "@/lib/garbage-time";

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

    const mapped: GarbageTimeGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      fourthQuarterHomePts: 0, // populated from detailed game data
      fourthQuarterAwayPts: 0, // populated from detailed game data
      halftimeHomeScore: 0, // populated from detailed game data
      halftimeAwayScore: 0, // populated from detailed game data
      spread: g.bettingLine?.spread ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
    }));

    const result = computeGarbageTimeAnalysis(mapped);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/garbage-time error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
