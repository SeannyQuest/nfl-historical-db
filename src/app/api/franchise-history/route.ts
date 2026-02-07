import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeFranchiseHistory, type FranchiseGame, type Team } from "@/lib/franchise-history";

export async function GET() {
  try {
    const [games, teams] = await Promise.all([
      prisma.game.findMany({
        include: {
          season: true,
          homeTeam: true,
          awayTeam: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.team.findMany(),
    ]);

    const franchiseGames: FranchiseGame[] = games.map((g) => ({
      season: g.season.year,
      homeTeamName: g.homeTeam.name,
      homeTeamFranchiseKey: g.homeTeam.franchiseKey,
      awayTeamName: g.awayTeam.name,
      awayTeamFranchiseKey: g.awayTeam.franchiseKey,
      homeScore: g.homeScore,
      awayScore: g.awayScore,
      isPlayoff: g.isPlayoff,
      isSuperBowl: g.week === "SuperBowl",
    }));

    const teamData: Team[] = teams.map((t) => ({
      id: t.id,
      name: t.name,
      abbreviation: t.abbreviation,
      city: t.city,
      nickname: t.nickname,
      conference: t.conference,
      division: t.division,
      franchiseKey: t.franchiseKey,
      isActive: t.isActive,
    }));

    const result = computeFranchiseHistory(franchiseGames, teamData);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/franchise-history error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
