import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchCfbSchedule, fetchCfbScores } from "@/lib/sportsradar/sync-cfb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, type, week } = body as {
      year?: number;
      type?: string;
      week?: string | number;
    };

    const seasonYear = year ?? new Date().getFullYear();
    const seasonType = type ?? "REG";

    // Fetch games from SportsRadar
    let games;
    if (week) {
      games = await fetchCfbScores(seasonYear, seasonType, week);
    } else {
      games = await fetchCfbSchedule(seasonYear, seasonType);
    }

    // Upsert season
    const season = await prisma.cfbSeason.upsert({
      where: { year: seasonYear },
      create: {
        year: seasonYear,
        type: seasonType,
      },
      update: {
        type: seasonType,
      },
    });

    // Upsert teams and games
    let upsertedCount = 0;
    const errors: string[] = [];

    for (const game of games) {
      try {
        // Ensure teams exist (using alias from game)
        const homeTeam = await prisma.cfbTeam.upsert({
          where: { alias: game.homeAlias || "UNKNOWN" },
          create: {
            name: `Team ${game.homeAlias}`,
            alias: game.homeAlias || "UNKNOWN",
            market: game.homeAlias || "Unknown",
            srId: game.srId ? `${game.srId}_home` : undefined,
          },
          update: {},
        });

        const awayTeam = await prisma.cfbTeam.upsert({
          where: { alias: game.awayAlias || "UNKNOWN" },
          create: {
            name: `Team ${game.awayAlias}`,
            alias: game.awayAlias || "UNKNOWN",
            market: game.awayAlias || "Unknown",
            srId: game.srId ? `${game.srId}_away` : undefined,
          },
          update: {},
        });

        // Upsert game
        await prisma.cfbGame.upsert({
          where: {
            date_homeTeamId_awayTeamId: {
              date: new Date(game.scheduled),
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
            },
          },
          create: {
            seasonId: season.id,
            date: new Date(game.scheduled),
            week: game.weekTitle || "1",
            dayOfWeek: game.dayOfWeek || "Unknown",
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeScore: game.homePoints || 0,
            awayScore: game.awayPoints || 0,
            scoreDiff: (game.homePoints || 0) - (game.awayPoints || 0),
            isPlayoff: game.status === "postseason" || false,
            srId: game.srId,
          },
          update: {
            homeScore: game.homePoints || 0,
            awayScore: game.awayPoints || 0,
            scoreDiff: (game.homePoints || 0) - (game.awayPoints || 0),
            isPlayoff: game.status === "postseason" || false,
          },
        });

        upsertedCount++;
      } catch (err) {
        errors.push(
          `Game on ${game.scheduled}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      sport: "cfb",
      year: seasonYear,
      type: seasonType,
      ...(week !== undefined ? { week } : {}),
      result: {
        synced: upsertedCount,
        total: games.length,
        errors,
      },
    });
  } catch (err) {
    console.error("POST /api/sync/cfb error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
