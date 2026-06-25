import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  console.log("DATABASE_URL:", databaseUrl);

  // Handle SQLite (file: prefix, relative path, or .db extension)
  const isSQLite = databaseUrl.startsWith("file:") ||
                   !databaseUrl.includes("://") ||
                   databaseUrl.endsWith(".db");

  console.log("isSQLite:", isSQLite);

  if (isSQLite) {
    const url = databaseUrl.startsWith("file:") ? databaseUrl : `file:${databaseUrl}`;
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }

  const usesAccelerate =
    databaseUrl.startsWith("prisma://") || databaseUrl.startsWith("prisma+postgres://");

  if (usesAccelerate) {
    return new PrismaClient({ accelerateUrl: databaseUrl }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from "@/generated/prisma/client";
export {
  ActionStatus,
  EvidenceType,
  Priority,
  RiskStatus,
} from "@/generated/prisma/client";
