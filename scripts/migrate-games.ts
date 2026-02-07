/**
 * Migrate 14,140 games from scripts/games-export.json into PostgreSQL.
 *
 * Usage: npx tsx scripts/migrate-games.ts
 *
 * Prerequisites:
 *   1. DATABASE_URL set in .env
 *   2. `npx prisma db push` to create tables
 *   3. `npx tsx prisma/seed-teams.ts` to seed teams
 *   4. scripts/games-export.json exists (extracted from git history data.js)
 */

import { readFileSync } from "fs";
import { join } from "path";
import {
  parseAllGames,
  deduplicateGames,
  extractSeasons,
  generateReport,
} from "./migrate-lib";
import type { RawGame, ParsedGame } from "./migrate-lib";

async function main() {
  const { PrismaClient } = await import("../src/generated/prisma");
  const prisma = new PrismaClient();

  try {
    // 1. Load raw data
    const dataPath = join(__dirname, "games-export.json");
    console.log("Loading games from", dataPath);
    const rawGames: RawGame[] = JSON.parse(readFileSync(dataPath, "utf8"));

    // 2. Generate pre-migration report
    const report = generateReport(rawGames);
    console.log("\n── Pre-Migration Report ──");
    console.log(`Total raw games:    ${report.totalGames}`);
    console.log(`Unique games:       ${report.uniqueGames}`);
    console.log(`Duplicates removed: ${report.duplicatesRemoved}`);
    console.log(`Season range:       ${report.seasonRange[0]}–${report.seasonRange[1]}`);
    console.log(`Seasons:            ${report.seasonCount}`);
    console.log(`Ties:               ${report.tieCount}`);
    console.log(`With betting data:  ${report.bettingCount} (${report.bettingPct}%)`);
    console.log(`With weather data:  ${report.weatherCount} (${report.weatherPct}%)`);
    console.log(`Playoff games:      ${report.playoffCount}`);

    if (report.unknownTeams.length > 0) {
      console.error("\nERROR: Unknown teams found:", report.unknownTeams);
      process.exit(1);
    }

    // 3. Parse and deduplicate
    const parsed = deduplicateGames(parseAllGames(rawGames));
    const seasons = extractSeasons(parsed);

    // 4. Build team name → ID map
    const teams = await prisma.team.findMany();
    const teamMap = new Map(teams.map((t) => [t.name, t.id]));

    // Verify all teams resolve
    for (const g of parsed) {
      if (!teamMap.has(g.homeTeamName)) {
        throw new Error(`Team not in DB: ${g.homeTeamName}`);
      }
      if (!teamMap.has(g.awayTeamName)) {
        throw new Error(`Team not in DB: ${g.awayTeamName}`);
      }
    }

    // 5. Create seasons
    console.log(`\nCreating ${seasons.length} seasons...`);
    for (const year of seasons) {
      await prisma.season.upsert({
        where: { year },
        update: {},
        create: { year },
      });
    }
    const seasonRecords = await prisma.season.findMany();
    const seasonMap = new Map(seasonRecords.map((s) => [s.year, s.id]));

    // 6. Insert games in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    let skipped = 0;

    console.log(`Inserting ${parsed.length} games in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
      const batch = parsed.slice(i, i + BATCH_SIZE);

      for (const g of batch) {
        const homeTeamId = teamMap.get(g.homeTeamName)!;
        const awayTeamId = teamMap.get(g.awayTeamName)!;
        const seasonId = seasonMap.get(g.season)!;
        const winnerId = g.winnerTeamName ? teamMap.get(g.winnerTeamName)! : null;

        try {
          const game = await prisma.game.upsert({
            where: {
              date_homeTeamId_awayTeamId: {
                date: g.date,
                homeTeamId,
                awayTeamId,
              },
            },
            update: {},
            create: {
              seasonId,
              week: g.week,
              date: g.date,
              time: g.time,
              dayOfWeek: g.dayOfWeek,
              homeTeamId,
              awayTeamId,
              homeScore: g.homeScore,
              awayScore: g.awayScore,
              scoreDiff: g.scoreDiff,
              winnerId,
              primetime: g.primetime,
              isPlayoff: g.isPlayoff,
            },
          });

          // Insert betting line if data exists
          if (g.betting) {
            await prisma.bettingLine.upsert({
              where: { gameId: game.id },
              update: {},
              create: {
                gameId: game.id,
                spread: g.betting.spread,
                overUnder: g.betting.overUnder,
                spreadResult: g.betting.spreadResult,
                ouResult: g.betting.ouResult,
                source: "pfr",
              },
            });
          }

          // Insert weather if data exists
          if (g.weather) {
            await prisma.weather.upsert({
              where: { gameId: game.id },
              update: {},
              create: {
                gameId: game.id,
                temperature: g.weather.temperature,
                wind: g.weather.wind,
                conditions: g.weather.conditions,
              },
            });
          }

          inserted++;
        } catch (err) {
          skipped++;
          if (skipped <= 5) {
            console.warn(`  Skipped: ${g.date.toISOString().split("T")[0]} ${g.awayTeamName} @ ${g.homeTeamName}: ${err}`);
          }
        }
      }

      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= parsed.length) {
        console.log(`  Progress: ${Math.min(i + BATCH_SIZE, parsed.length)}/${parsed.length} (inserted: ${inserted}, skipped: ${skipped})`);
      }
    }

    // 7. Post-migration verification
    const gameCount = await prisma.game.count();
    const bettingCount = await prisma.bettingLine.count();
    const weatherCount = await prisma.weather.count();
    const seasonCount = await prisma.season.count();

    console.log("\n── Post-Migration Verification ──");
    console.log(`Games in DB:        ${gameCount}`);
    console.log(`Betting lines:      ${bettingCount}`);
    console.log(`Weather records:    ${weatherCount}`);
    console.log(`Seasons:            ${seasonCount}`);
    console.log(`Inserted:           ${inserted}`);
    console.log(`Skipped:            ${skipped}`);

    if (gameCount !== report.uniqueGames) {
      console.warn(`\nWARNING: Expected ${report.uniqueGames} games, got ${gameCount}`);
    } else {
      console.log("\nMigration complete. All games imported successfully.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
