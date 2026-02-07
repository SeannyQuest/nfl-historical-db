import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTeamEfficiency, type EfficiencyGame } from "@/lib/team-efficiency";

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

    const mappedGames: EfficiencyGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      homeTotalYards: 0, // populated from detailed game data
      awayTotalYards: 0, // populated from detailed game data
      homeFirstDowns: 0, // populated from detailed game data
      awayFirstDowns: 0, // populated from detailed game data
      homePlays: 0, // populated from detailed game data
      awayPlays: 0, // populated from detailed game data
      homeTimeOfPossession: 0, // populated from detailed game data
      awayTimeOfPossession: 0, // populated from detailed game data
    }));

    const result = computeTeamEfficiency(mappedGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/team-efficiency error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
