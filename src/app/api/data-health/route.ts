import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDataHealth } from "@/lib/data-health";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport");

    // Fetch all games for requested sports or all sports
    const nflGames = await prisma.game.findMany();
    const cfbGames = await prisma.cfbGame.findMany({
      include: { season: true },
    });
    const cbbGames = await prisma.cbbGame.findMany({
      include: { season: true },
    });

    const reports: Record<string, { grade: string }> = {};

    // Compute health for requested sport or all
    if (!sport || sport === "nfl") {
      reports.nfl = computeDataHealth(nflGames, "nfl");
    }

    if (!sport || sport === "cfb") {
      reports.cfb = computeDataHealth(cfbGames, "cfb");
    }

    if (!sport || sport === "cbb") {
      reports.cbb = computeDataHealth(cbbGames, "cbb");
    }

    // Calculate overall grade
    const allReports = Object.values(reports);
    const avgGradeValue = (grade: string): number => {
      const gradeMap: Record<string, number> = {
        A: 5,
        B: 4,
        C: 3,
        D: 2,
        F: 1,
      };
      return gradeMap[grade] || 0;
    };

    const overallAvg =
      allReports.length > 0
        ? allReports.reduce((sum: number, r: { grade: string }) => sum + avgGradeValue(r.grade), 0) /
          allReports.length
        : 0;

    const overallGradeMap: Record<number, string> = {
      5: "A",
      4: "B",
      3: "C",
      2: "D",
      1: "F",
    };

    const overallGrade =
      overallGradeMap[Math.round(overallAvg)] || "F";

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallGrade,
      reports,
    });
  } catch (err) {
    console.error("GET /api/data-health error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
