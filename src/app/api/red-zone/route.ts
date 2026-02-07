import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRedZoneEfficiency, type RedZoneGame } from "@/lib/red-zone";

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

    const mapped: RedZoneGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTouchdowns: 0, // populated from detailed game data
      awayTouchdowns: 0, // populated from detailed game data
      homeFieldGoals: 0, // populated from detailed game data
      awayFieldGoals: 0, // populated from detailed game data
    }));

    const result = computeRedZoneEfficiency(mapped);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/red-zone error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
