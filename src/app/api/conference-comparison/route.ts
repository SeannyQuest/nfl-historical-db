import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeConferenceComparison, type ConferenceGame } from "@/lib/conference-comparison";

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

    const conferenceGames: ConferenceGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeam: { conference: g.homeTeam.conference },
      awayTeam: { conference: g.awayTeam.conference },
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isSuperBowl: g.week === "SuperBowl",
      spreadResult: g.bettingLine?.spreadResult ?? null,
    }));

    const result = computeConferenceComparison(conferenceGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/conference-comparison error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
