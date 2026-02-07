import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStreaks, type StreakGame } from "@/lib/streaks";

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

    const streakGames: StreakGame[] = games.map((g) => ({
      season: g.season.year,
      date: g.date.toISOString(),
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
      isPlayoff: g.isPlayoff,
    }));

    const result = computeStreaks(streakGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/streaks error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
