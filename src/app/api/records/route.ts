import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeRecords, type RecordGame } from "@/lib/records";

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

    const recordGames: RecordGame[] = games.map((g) => ({
      id: g.id,
      date: g.date.toISOString(),
      season: g.season.year,
      week: g.week,
      isPlayoff: g.isPlayoff,
      homeTeamName: g.homeTeam.name,
      homeTeamAbbr: g.homeTeam.abbreviation,
      awayTeamName: g.awayTeam.name,
      awayTeamAbbr: g.awayTeam.abbreviation,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      spread: g.bettingLine?.spread ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
      overUnder: g.bettingLine?.overUnder ?? null,
    }));

    const records = computeRecords(recordGames, 15);

    return NextResponse.json({ data: records });
  } catch (err) {
    console.error("GET /api/records error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
