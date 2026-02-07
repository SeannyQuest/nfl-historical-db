import { NextResponse } from "next/server";
import { getApiUsage } from "@/lib/sportsradar/client";

export async function GET() {
  try {
    const [nfl, ncaafb, ncaamb] = await Promise.all([
      getApiUsage("nfl"),
      getApiUsage("ncaafb"),
      getApiUsage("ncaamb"),
    ]);

    return NextResponse.json({
      nfl,
      ncaafb,
      ncaamb,
    });
  } catch (err) {
    console.error("GET /api/api-usage error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
