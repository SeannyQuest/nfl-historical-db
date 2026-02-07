import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchCbbSeasonSchedule,
  fetchCbbDailySchedule,
} from "@/lib/sportsradar/sync-cbb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, date } = body as {
      year?: number;
      date?: string;
    };

    const seasonYear = year ?? new Date().getFullYear();

    // Fetch games from SportsRadar
    let games;
    if (date) {
      games = await fetchCbbDailySchedule(seasonYear, date);
    } else {
      games = await fetchCbbSeasonSchedule(seasonYear);
    }

    // Upsert season
    const season = await prisma.cbbSeason.upsert({
      where: { year: seasonYear },
      create: {
        year: seasonYear,
      },
      update: {},
    });

    // Upsert teams and games
    let upsertedCount = 0;
    const errors: string[] = [];

    for (const game of games) {
      try {
        // Ensure teams exist (using alias from game)
        const homeTeam = await prisma.cbbTeam.upsert({
          where: { alias: game.homeAlias || "UNKNOWN" },
          create: {
            name: `Team ${game.homeAlias}`,
            alias: game.homeAlias || "UNKNOWN",
            market: game.homeAlias || "Unknown",
            srId: game.srId ? `${game.srId}_home` : undefined,
          },
          update: {},
        });

        const awayTeam = await prisma.cbbTeam.upsert({
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
        await prisma.cbbGame.upsert({
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
            dayOfWeek: game.dayOfWeek || "Unknown",
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            homeScore: game.homePoints || 0,
            awayScore: game.awayPoints || 0,
            scoreDiff: (game.homePoints || 0) - (game.awayPoints || 0),
            isTournament: false,
            tournamentRound: null,
            srId: game.srId,
          },
          update: {
            homeScore: game.homePoints || 0,
            awayScore: game.awayPoints || 0,
            scoreDiff: (game.homePoints || 0) - (game.awayPoints || 0),
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
      sport: "cbb",
      year: seasonYear,
      ...(date !== undefined ? { date } : {}),
      result: {
        synced: upsertedCount,
        total: games.length,
        errors,
      },
    });
  } catch (err) {
    console.error("POST /api/sync/cbb error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
