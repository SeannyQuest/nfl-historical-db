import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePlayoffStats, type PlayoffGame } from "@/lib/playoff-stats";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isPlayoff: true },
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
        season: true,
      },
      orderBy: { date: "asc" },
    });

    const playoffGames: PlayoffGame[] = games.map((g) => ({
      id: g.id,
      date: g.date.toISOString(),
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamName: g.awayTeam.name,
      awayTeamAbbr: g.awayTeam.abbreviation,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
    }));

    const stats = computePlayoffStats(playoffGames);

    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error("GET /api/playoff-stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
