import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new PrismaNeon(pool as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new PrismaClient({ adapter } as any);
    } catch {
      // Fallback to direct connection if adapter fails
    }
  }
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
