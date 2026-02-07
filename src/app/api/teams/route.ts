import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TeamFiltersSchema } from "@/lib/schemas";
import { buildTeamWhere } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = TeamFiltersSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const where = buildTeamWhere(parsed.data);

    const teams = await prisma.team.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: teams });
  } catch (err) {
    console.error("GET /api/teams error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
