import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SeasonFiltersSchema } from "@/lib/schemas";
import { buildSeasonWhere } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = SeasonFiltersSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const where = buildSeasonWhere(parsed.data);

    const seasons = await prisma.season.findMany({
      where,
      orderBy: { year: "desc" },
    });

    return NextResponse.json({ data: seasons });
  } catch (err) {
    console.error("GET /api/seasons error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
