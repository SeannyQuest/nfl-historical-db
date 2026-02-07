import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSearchQuery } from "@/lib/search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 }
      );
    }

    const filters = buildSearchQuery(q);

    // Build where clause
    const where: Record<string, unknown> = { isPlayoff: false };

    // Filter by teams
    if (filters.teamNames.length > 0) {
      where.OR = filters.teamNames.flatMap((teamName) => [
        { homeTeam: { name: teamName } },
        { awayTeam: { name: teamName } },
      ]);
    }

    // Filter by season range
    if (filters.seasonStart || filters.seasonEnd) {
      where.season = {
        year: {
          gte: filters.seasonStart,
          lte: filters.seasonEnd,
        },
      };
    }

    // Filter by week
    if (filters.week) {
      where.week = filters.week;
    }

    // Fetch games
    const games = await prisma.game.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        season: true,
        bettingLine: true,
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    // Filter by score range if specified
    let filtered = games;
    if (filters.scoreMin !== undefined || filters.scoreMax !== undefined) {
      filtered = games.filter((g) => {
        const total = g.homeScore + g.awayScore;
        if (filters.scoreMin !== undefined && total < filters.scoreMin)
          return false;
        if (filters.scoreMax !== undefined && total > filters.scoreMax)
          return false;
        return true;
      });
    }

    return NextResponse.json({
      data: filtered.map((g) => ({
        id: g.id,
        date: g.date,
        season: g.season.year,
        week: g.week,
        homeTeam: {
          name: g.homeTeam.name,
          abbreviation: g.homeTeam.abbreviation,
        },
        awayTeam: {
          name: g.awayTeam.name,
          abbreviation: g.awayTeam.abbreviation,
        },
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        total: g.homeScore + g.awayScore,
        spread: g.bettingLine?.spread,
        overUnder: g.bettingLine?.overUnder,
      })),
      filters,
      count: filtered.length,
    });
  } catch (err) {
    console.error("GET /api/search error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
