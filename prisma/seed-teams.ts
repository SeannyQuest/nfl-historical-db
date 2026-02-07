/**
 * Seed all NFL teams into PostgreSQL.
 *
 * Usage: npx tsx prisma/seed-teams.ts
 *
 * Requires: DATABASE_URL env var, `npx prisma db push` already run.
 */

import { ALL_TEAMS } from "./team-data";

async function main() {
  const { PrismaClient } = await import("../src/generated/prisma");
  const prisma = new PrismaClient();

  try {
    console.log("Seeding teams...");

    for (const team of ALL_TEAMS) {
      await prisma.team.upsert({
        where: { name: team.name },
        update: {
          abbreviation: team.abbreviation,
          city: team.city,
          nickname: team.nickname,
          conference: team.conference,
          division: team.division,
          franchiseKey: team.franchiseKey,
          isActive: team.isActive,
        },
        create: team,
      });
    }

    const activeCount = await prisma.team.count({ where: { isActive: true } });
    const totalCount = await prisma.team.count();
    console.log(`Seeded ${totalCount} teams (${activeCount} active, ${totalCount - activeCount} historical)`);

    if (activeCount !== 32) {
      throw new Error(`Expected 32 active teams, got ${activeCount}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
