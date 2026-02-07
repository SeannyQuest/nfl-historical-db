import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeMatchup, type MatchupGame } from "@/lib/matchups";

export async function GET(request: NextRequest) {
  try {
    const team1 = request.nextUrl.searchParams.get("team1");
    const team2 = request.nextUrl.searchParams.get("team2");

    if (!team1 || !team2) {
      return NextResponse.json(
        { error: "Both team1 and team2 query parameters are required" },
        { status: 400 }
      );
    }

    if (team1 === team2) {
      return NextResponse.json(
        { error: "team1 and team2 must be different teams" },
        { status: 400 }
      );
    }

    // Verify both teams exist
    const [t1, t2] = await Promise.all([
      prisma.team.findUnique({ where: { name: team1 } }),
      prisma.team.findUnique({ where: { name: team2 } }),
    ]);

    if (!t1) {
      return NextResponse.json({ error: `Team not found: ${team1}` }, { status: 404 });
    }
    if (!t2) {
      return NextResponse.json({ error: `Team not found: ${team2}` }, { status: 404 });
    }

    // Fetch all games between these two teams
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { homeTeamId: t1.id, awayTeamId: t2.id },
          { homeTeamId: t2.id, awayTeamId: t1.id },
        ],
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        winner: true,
        season: true,
        bettingLine: true,
      },
      orderBy: { date: "desc" },
    });

    // Map to pure MatchupGame interface
    const matchupGames: MatchupGame[] = games.map((g) => ({
      date: g.date.toISOString(),
      week: g.week,
      season: g.season.year,
      isPlayoff: g.isPlayoff,
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
      spread: g.bettingLine?.spread ?? null,
      overUnder: g.bettingLine?.overUnder ?? null,
    }));

    const result = computeMatchup(matchupGames, team1, team2);

    return NextResponse.json({
      data: {
        ...result,
        team1Info: {
          name: t1.name,
          abbreviation: t1.abbreviation,
          city: t1.city,
          nickname: t1.nickname,
        },
        team2Info: {
          name: t2.name,
          abbreviation: t2.abbreviation,
          city: t2.city,
          nickname: t2.nickname,
        },
      },
    });
  } catch (err) {
    console.error("GET /api/matchups error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
