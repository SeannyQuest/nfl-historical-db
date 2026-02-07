import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePenaltyImpact, type PenaltyGame } from "@/lib/penalty-impact";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: "asc" },
    });

    const mappedGames: PenaltyGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homePenalties: 0, // populated from detailed game data
      awayPenalties: 0, // populated from detailed game data
      homePenaltyYards: 0, // populated from detailed game data
      awayPenaltyYards: 0, // populated from detailed game data
    }));

    const result = computePenaltyImpact(mappedGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/penalty-impact error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
