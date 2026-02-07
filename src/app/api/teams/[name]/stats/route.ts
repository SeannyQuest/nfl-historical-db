import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeTeamStats, type GameForStats } from "@/lib/team-stats";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const teamName = decodeURIComponent(name);

    // Fetch team info
    const team = await prisma.team.findUnique({
      where: { name: teamName },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Fetch all games for this team with related data
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { homeTeamId: team.id },
          { awayTeamId: team.id },
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

    // Map DB rows to the pure GameForStats interface
    const statsGames: GameForStats[] = games.map((g) => ({
      homeTeamName: g.homeTeam.name,
      awayTeamName: g.awayTeam.name,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winnerName: g.winner?.name ?? null,
      season: g.season.year,
      isPlayoff: g.isPlayoff,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
      spread: g.bettingLine?.spread ?? null,
      overUnder: g.bettingLine?.overUnder ?? null,
    }));

    const stats = computeTeamStats(statsGames, teamName);

    // Recent games (last 10) with full detail for display
    const recentGames = games.slice(0, 10).map((g) => ({
      id: g.id,
      date: g.date.toISOString(),
      week: g.week,
      isPlayoff: g.isPlayoff,
      homeTeam: { name: g.homeTeam.name, abbreviation: g.homeTeam.abbreviation },
      awayTeam: { name: g.awayTeam.name, abbreviation: g.awayTeam.abbreviation },
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      winner: g.winner ? { name: g.winner.name, abbreviation: g.winner.abbreviation } : null,
      spreadResult: g.bettingLine?.spreadResult ?? null,
      ouResult: g.bettingLine?.ouResult ?? null,
    }));

    return NextResponse.json({
      data: {
        team: {
          name: team.name,
          abbreviation: team.abbreviation,
          city: team.city,
          nickname: team.nickname,
          conference: team.conference,
          division: team.division,
          isActive: team.isActive,
        },
        stats,
        recentGames,
        totalGames: games.length,
      },
    });
  } catch (err) {
    console.error("GET /api/teams/[name]/stats error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
