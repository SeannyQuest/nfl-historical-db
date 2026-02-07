import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameQuerySchema } from "@/lib/schemas";
import { buildGameWhere, buildGameOrderBy, buildPagination } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = GameQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, sort, order, ...filters } = parsed.data;
    const where = buildGameWhere(filters);
    const orderBy = buildGameOrderBy(sort, order);
    const pagination = buildPagination(page, limit);

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy,
        ...pagination,
        include: {
          homeTeam: true,
          awayTeam: true,
          winner: true,
          season: true,
          bettingLine: true,
          weather: true,
        },
      }),
      prisma.game.count({ where }),
    ]);

    return NextResponse.json({
      data: games,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/games error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
