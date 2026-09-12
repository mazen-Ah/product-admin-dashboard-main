import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveSqlitePath() {
  const configured = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const relative = configured.startsWith("file:")
    ? configured.slice("file:".length)
    : configured;
  const source = path.isAbsolute(relative)
    ? relative
    : path.join(process.cwd(), relative);

  const ephemeral = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!ephemeral) return source;

  const dest = path.join(os.tmpdir(), "roads-prototype.db");
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
  }
  return dest;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqlitePath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
