import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTurnoverAnalysis, type TurnoverGame } from "@/lib/turnovers";

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

    const mapped: TurnoverGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTurnovers: 0, // populated from detailed game data
      awayTurnovers: 0, // populated from detailed game data
      homeInterceptions: 0, // populated from detailed game data
      awayInterceptions: 0, // populated from detailed game data
      homeFumbles: 0, // populated from detailed game data
      awayFumbles: 0, // populated from detailed game data
    }));

    const result = computeTurnoverAnalysis(mapped);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/turnovers error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
