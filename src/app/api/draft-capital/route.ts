import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDraftCapitalImpact, type DraftCapitalTeam } from "@/lib/draft-capital";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: { date: "asc" },
    });

    // Build team win/loss records per season
    const teamRecords = new Map<string, { wins: number; losses: number }>();
    for (const g of games) {
      if (g.isPlayoff) continue;
      const homeKey = `${g.homeTeam.name}-${g.season.year}`;
      const awayKey = `${g.awayTeam.name}-${g.season.year}`;
      if (!teamRecords.has(homeKey)) teamRecords.set(homeKey, { wins: 0, losses: 0 });
      if (!teamRecords.has(awayKey)) teamRecords.set(awayKey, { wins: 0, losses: 0 });

      if (g.homeScore > g.awayScore) {
        teamRecords.get(homeKey)!.wins++;
        teamRecords.get(awayKey)!.losses++;
      } else {
        teamRecords.get(homeKey)!.losses++;
        teamRecords.get(awayKey)!.wins++;
      }
    }

    // Map to DraftCapitalTeam (use inverse standings for draft position approximation)
    const seasonTeams = new Map<number, Array<{ team: string; wins: number; losses: number }>>();
    for (const [key, record] of teamRecords) {
      const [team, seasonStr] = key.split(/-(\d+)$/);
      const season = parseInt(seasonStr, 10);
      if (!seasonTeams.has(season)) seasonTeams.set(season, []);
      seasonTeams.get(season)!.push({ team, ...record });
    }

    const mapped: DraftCapitalTeam[] = [];
    for (const [season, teams] of seasonTeams) {
      // Sort by wins desc to approximate draft position (worst teams pick first NEXT season)
      const sorted = [...teams].sort((a, b) => a.wins - b.wins);
      sorted.forEach((t, idx) => {
        mapped.push({
          team: t.team,
          season,
          wins: t.wins,
          losses: t.losses,
          draftPosition: idx + 1,
        });
      });
    }

    const result = computeDraftCapitalImpact(mapped);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/draft-capital error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
