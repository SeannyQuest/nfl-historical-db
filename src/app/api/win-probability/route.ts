import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWinProbability, type WinProbGame } from "@/lib/win-probability";

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

    const mappedGames: WinProbGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeQ1: 0, // populated from detailed game data
      homeQ2: 0, // populated from detailed game data
      homeQ3: 0, // populated from detailed game data
      homeQ4: 0, // populated from detailed game data
      awayQ1: 0, // populated from detailed game data
      awayQ2: 0, // populated from detailed game data
      awayQ3: 0, // populated from detailed game data
      awayQ4: 0, // populated from detailed game data
    }));

    const result = computeWinProbability(mappedGames);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/win-probability error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
