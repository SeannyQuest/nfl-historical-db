import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeWeatherImpact, type WeatherGame } from "@/lib/weather-impact";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        bettingLine: true,
        weather: true,
      },
      orderBy: { date: "asc" },
    });

    const weatherGames: WeatherGame[] = games.map((g) => {
      // Parse wind string to extract numeric value (e.g., "12 mph" -> 12)
      let windSpeed: number | null = null;
      if (g.weather?.wind) {
        const match = g.weather.wind.match(/^(\d+)/);
        windSpeed = match ? parseInt(match[1], 10) : null;
      }

      return {
        season: g.season.year,
        homeScore: g.homeScore,
        awayScore: g.awayScore,
        conditions: g.weather?.conditions ?? null,
        temperature: g.weather?.temperature ?? null,
        windSpeed,
        spreadResult: g.bettingLine?.spreadResult ?? null,
        ouResult: g.bettingLine?.ouResult ?? null,
      };
    });

    const result = computeWeatherImpact(weatherGames);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/weather-impact error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
