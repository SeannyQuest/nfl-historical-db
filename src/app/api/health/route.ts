import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  // Test DB connection
  try {
    const teamCount = await prisma.team.count();
    const seasonCount = await prisma.season.count();
    const gameCount = await prisma.game.count();
    const userCount = await prisma.user.count();

    checks.database = "connected";
    checks.counts = { teams: teamCount, seasons: seasonCount, games: gameCount, users: userCount };
  } catch (dbErr) {
    checks.database = "FAILED";
    checks.dbError = dbErr instanceof Error ? dbErr.message : String(dbErr);
  }

  return NextResponse.json(checks, { status: 200 });
}
