import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSchedule, type ScheduleGame } from "@/lib/schedule";

export async function GET(request: NextRequest) {
  try {
    const seasonParam = request.nextUrl.searchParams.get("season");
    const weekParam = request.nextUrl.searchParams.get("week");

    const seasonYear = seasonParam ? parseInt(seasonParam, 10) : null;

    if (seasonParam && (isNaN(seasonYear!) || seasonYear! < 1920 || seasonYear! > 2100)) {
      return NextResponse.json(
        { error: "Invalid season parameter" },
        { status: 400 }
      );
    }

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

    const scheduleGames: ScheduleGame[] = games.map((g) => ({
      id: g.id,
      date: g.date.toISOString(),
      season: g.season.year,
      week: g.week,
      time: g.time,
      dayOfWeek: g.dayOfWeek,
      isPlayoff: g.isPlayoff,
      primetime: g.primetime,
      homeTeamName: g.homeTeam.name,
      homeTeamAbbr: g.homeTeam.abbreviation,
      homeTeamCity: g.homeTeam.city,
      awayTeamName: g.awayTeam.name,
      awayTeamAbbr: g.awayTeam.abbreviation,
      awayTeamCity: g.awayTeam.city,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      spread: g.bettingLine?.spread ?? null,
      overUnder: g.bettingLine?.overUnder ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
    }));

    const schedule = computeSchedule(scheduleGames, seasonYear, weekParam);

    return NextResponse.json({ data: schedule });
  } catch (err) {
    console.error("GET /api/schedule error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
