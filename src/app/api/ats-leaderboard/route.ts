import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAtsLeaderboard, type ATSGame } from "@/lib/ats-leaderboard";

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

    const atsGames: ATSGame[] = games.map((g) => ({
      season: g.season.year,
      week: g.week,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamAbbr: g.awayTeam.abbreviation,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      homeSide: null,
    }));

    const result = computeAtsLeaderboard(atsGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/ats-leaderboard error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
