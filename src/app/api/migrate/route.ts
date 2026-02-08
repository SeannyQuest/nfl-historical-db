import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface GameInput {
  season: number;
  week: string;
  day: string;
  date: string;
  time: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  primetime?: string;
  temperature?: number;
  wind?: string;
  conditions?: string;
  spread?: number;
  overUnder?: number;
  spreadResult?: string;
  ouResult?: string;
}

interface MigrateResponse {
  synced: number;
  errors: number;
  bettingLines: number;
  weatherRecords: number;
  errorDetails?: Array<{
    gameIndex: number;
    homeTeam: string;
    awayTeam: string;
    error: string;
  }>;
}

function mapSpreadResult(
  result?: string
): "COVERED" | "LOST" | "PUSH" | null {
  if (!result) return null;
  const mapped: Record<string, "COVERED" | "LOST" | "PUSH"> = {
    Covered: "COVERED",
    Lost: "LOST",
    Push: "PUSH",
  };
  return mapped[result] || null;
}

function mapOuResult(result?: string): "OVER" | "UNDER" | "PUSH" | null {
  if (!result) return null;
  const mapped: Record<string, "OVER" | "UNDER" | "PUSH"> = {
    Over: "OVER",
    Under: "UNDER",
    Push: "PUSH",
  };
  return mapped[result] || null;
}

function detectIsPlayoff(week: string): boolean {
  const playoffWeeks = ["WildCard", "Division", "ConfChamp", "SuperBowl"];
  return playoffWeeks.includes(week);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const games: GameInput[] = body.games || [];

    if (!Array.isArray(games)) {
      return NextResponse.json(
        { error: "games must be an array" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Load all teams into a name→id map
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
    });

    const teamMap = new Map<string, string>();
    teams.forEach((team) => {
      teamMap.set(team.name, team.id);
    });

    let synced = 0;
    let bettingLines = 0;
    let weatherRecords = 0;
    const errorList: Array<{
      gameIndex: number;
      homeTeam: string;
      awayTeam: string;
      error: string;
    }> = [];

    // Process each game
    for (let i = 0; i < games.length; i++) {
      const game = games[i];

      try {
        // Find home/away team IDs
        const homeTeamId = teamMap.get(game.home);
        const awayTeamId = teamMap.get(game.away);

        if (!homeTeamId) {
          throw new Error(`Home team not found: ${game.home}`);
        }
        if (!awayTeamId) {
          throw new Error(`Away team not found: ${game.away}`);
        }

        // Upsert Season record
        const season = await prisma.season.upsert({
          where: { year: game.season },
          create: { year: game.season },
          update: {},
        });

        // Calculate scoreDiff and winnerId
        const scoreDiff = (game.homeScore ?? 0) - (game.awayScore ?? 0);
        const winnerId =
          game.homeScore === game.awayScore
            ? null
            : game.homeScore > game.awayScore
              ? homeTeamId
              : awayTeamId;

        // Parse date with UTC noon to avoid timezone issues
        const gameDate = new Date(game.date + "T12:00:00Z");

        // Upsert Game record
        const upsertedGame = await prisma.game.upsert({
          where: {
            date_homeTeamId_awayTeamId: {
              date: gameDate,
              homeTeamId,
              awayTeamId,
            },
          },
          create: {
            date: gameDate,
            homeTeamId,
            awayTeamId,
            seasonId: season.id,
            week: String(game.week),
            dayOfWeek: game.day ?? "Unknown",
            time: game.time ?? null,
            homeScore: game.homeScore ?? 0,
            awayScore: game.awayScore ?? 0,
            scoreDiff,
            winnerId,
            primetime: game.primetime ?? null,
            isPlayoff: detectIsPlayoff(String(game.week)),
          },
          update: {
            homeScore: game.homeScore ?? 0,
            awayScore: game.awayScore ?? 0,
            scoreDiff,
            winnerId,
            primetime: game.primetime ?? null,
            isPlayoff: detectIsPlayoff(String(game.week)),
          },
        });

        synced++;

        // Upsert BettingLine if spread or overUnder exist
        if (game.spread != null || game.overUnder != null) {
          const mappedSpreadResult = mapSpreadResult(game.spreadResult);
          const mappedOuResult = mapOuResult(game.ouResult);

          await prisma.bettingLine.upsert({
            where: { gameId: upsertedGame.id },
            create: {
              gameId: upsertedGame.id,
              spread: game.spread ?? null,
              overUnder: game.overUnder ?? null,
              spreadResult: mappedSpreadResult,
              ouResult: mappedOuResult,
            },
            update: {
              spread: game.spread ?? null,
              overUnder: game.overUnder ?? null,
              spreadResult: mappedSpreadResult,
              ouResult: mappedOuResult,
            },
          });

          bettingLines++;
        }

        // Upsert Weather if temperature, wind, or conditions exist
        if (game.temperature != null || game.wind != null || game.conditions != null) {
          await prisma.weather.upsert({
            where: { gameId: upsertedGame.id },
            create: {
              gameId: upsertedGame.id,
              temperature: game.temperature ?? null,
              wind: game.wind ?? null,
              conditions: game.conditions ?? null,
            },
            update: {
              temperature: game.temperature ?? null,
              wind: game.wind ?? null,
              conditions: game.conditions ?? null,
            },
          });

          weatherRecords++;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errorList.push({
          gameIndex: i,
          homeTeam: game.home,
          awayTeam: game.away,
          error: errorMessage,
        });
      }
    }

    const response: MigrateResponse = {
      synced,
      errors: errorList.length,
      bettingLines,
      weatherRecords,
    };

    if (errorList.length > 0) {
      response.errorDetails = errorList;
    }

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
