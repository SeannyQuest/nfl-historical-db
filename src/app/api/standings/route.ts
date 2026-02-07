import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStandings, type StandingsGame, type TeamInfo } from "@/lib/standings";

export async function GET(request: NextRequest) {
  try {
    const seasonParam = request.nextUrl.searchParams.get("season");
    const seasonYear = seasonParam ? parseInt(seasonParam, 10) : null;

    if (seasonParam && (isNaN(seasonYear!) || seasonYear! < 1920 || seasonYear! > 2100)) {
      return NextResponse.json(
        { error: "Invalid season parameter" },
        { status: 400 }
      );
    }

    // Fetch active teams
    const teams = await prisma.team.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const teamInfos: TeamInfo[] = teams.map((t) => ({
      name: t.name,
      abbreviation: t.abbreviation,
      city: t.city,
      nickname: t.nickname,
      conference: t.conference,
      division: t.division,
    }));

    // Fetch games (optionally filtered by season)
    const games = await prisma.game.findMany({
      where: seasonYear
        ? { season: { year: seasonYear } }
        : undefined,
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
      },
      orderBy: { date: "asc" },
    });

    const standingsGames: StandingsGame[] = games.map((g) => ({
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      isPlayoff: g.isPlayoff,
    }));

    const standings = computeStandings(standingsGames, teamInfos, seasonYear);

    return NextResponse.json({ data: standings });
  } catch (err) {
    console.error("GET /api/standings error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
