import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeByeWeekImpact, type ByeWeekGame } from "@/lib/bye-week";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      include: {
        season: true,
        homeTeam: true,
        awayTeam: true,
        bettingLine: true,
      },
      orderBy: { date: "asc" },
    });

    // Build a map of (team, season) → set of weeks played
    const teamWeeks = new Map<string, Set<number>>();
    for (const g of games) {
      if (g.isPlayoff) continue;
      const weekNum = parseInt(g.week, 10);
      if (isNaN(weekNum)) continue;
      const homeKey = `${g.homeTeam.name}-${g.season.year}`;
      const awayKey = `${g.awayTeam.name}-${g.season.year}`;
      if (!teamWeeks.has(homeKey)) teamWeeks.set(homeKey, new Set());
      if (!teamWeeks.has(awayKey)) teamWeeks.set(awayKey, new Set());
      teamWeeks.get(homeKey)!.add(weekNum);
      teamWeeks.get(awayKey)!.add(weekNum);
    }

    // Determine bye week: first missing week number
    const teamByeWeek = new Map<string, number>();
    for (const [key, weeksPlayed] of teamWeeks) {
      const maxWeek = Math.max(...weeksPlayed);
      for (let w = 1; w <= maxWeek; w++) {
        if (!weeksPlayed.has(w)) {
          teamByeWeek.set(key, w);
          break;
        }
      }
    }

    const byeWeekGames: ByeWeekGame[] = games
      .filter((g) => !g.isPlayoff && !isNaN(parseInt(g.week, 10)))
      .map((g) => {
        const weekNum = parseInt(g.week, 10);
        const homeKey = `${g.homeTeam.name}-${g.season.year}`;
        const awayKey = `${g.awayTeam.name}-${g.season.year}`;
        const homeBye = teamByeWeek.get(homeKey);
        const awayBye = teamByeWeek.get(awayKey);
        return {
          season: g.season.year,
          week: weekNum,
          homeTeamName: g.homeTeam.name,
          awayTeamName: g.awayTeam.name,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          homeOnBye: homeBye !== undefined && weekNum === homeBye + 1,
          awayOnBye: awayBye !== undefined && weekNum === awayBye + 1,
          spreadResult: g.bettingLine?.spreadResult ?? null,
          ouResult: g.bettingLine?.ouResult ?? null,
        };
      });

    const result = computeByeWeekImpact(byeWeekGames);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("GET /api/bye-week error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
