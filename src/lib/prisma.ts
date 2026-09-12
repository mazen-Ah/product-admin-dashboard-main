import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function configuredSqliteFile() {
  const configured = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = configured.startsWith("file:")
    ? configured.slice("file:".length)
    : configured;
  return path.isAbsolute(relative) ? relative : path.join(process.cwd(), relative);
}

function findSeededDatabase() {
  const candidates = [
    configuredSqliteFile(),
    path.join(process.cwd(), "prisma", "seeded.db"),
    path.join(process.cwd(), "prisma", "dev.db"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).size > 10_000) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function resolveSqlitePath() {
  const source = configuredSqliteFile();
  const ephemeral = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!ephemeral) return source;

  const dest = path.join(os.tmpdir(), "roads-prototype.db");
  const seeded = findSeededDatabase();
  const destOk = fs.existsSync(dest) && fs.statSync(dest).size > 10_000;
  if (!destOk && seeded) {
    fs.copyFileSync(seeded, dest);
  }
  return dest;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqlitePath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
