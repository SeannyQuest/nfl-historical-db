import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {
    api: "ok",
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "set (" + process.env.DATABASE_URL.substring(0, 30) + "...)" : "NOT SET",
      AUTH_SECRET: process.env.AUTH_SECRET ? "set" : "NOT SET (using fallback)",
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  // Test Prisma import
  try {
    const { PrismaClient } = await import("@/generated/prisma/client");
    checks.prismaImport = "ok";

    // Test DB connection
    try {
      const prisma = new PrismaClient();
      const teamCount = await prisma.team.count();
      const seasonCount = await prisma.season.count();
      const gameCount = await prisma.game.count();
      const userCount = await prisma.user.count();
      await prisma.$disconnect();

      checks.database = "connected";
      checks.counts = { teams: teamCount, seasons: seasonCount, games: gameCount, users: userCount };
    } catch (dbErr) {
      checks.database = "FAILED";
      checks.dbError = dbErr instanceof Error ? dbErr.message : String(dbErr);
    }
  } catch (importErr) {
    checks.prismaImport = "FAILED";
    checks.importError = importErr instanceof Error ? importErr.message : String(importErr);
  }

  return NextResponse.json(checks, { status: 200 });
}
