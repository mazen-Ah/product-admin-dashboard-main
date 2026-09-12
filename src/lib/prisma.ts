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
    path.join(process.cwd(), "prisma", "seeded.db"),
    configuredSqliteFile(),
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

function deployMarker() {
  return (
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "local"
  );
}

function resolveSqlitePath() {
  const source = configuredSqliteFile();
  const ephemeral = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (!ephemeral) return source;

  const dest = path.join(os.tmpdir(), "roads-prototype.db");
  const marker = path.join(os.tmpdir(), "roads-prototype.db.deploy");
  const seeded = findSeededDatabase();
  const currentDeploy = deployMarker();
  const previousDeploy = fs.existsSync(marker) ? fs.readFileSync(marker, "utf8") : "";
  const destOk = fs.existsSync(dest) && fs.statSync(dest).size > 10_000;
  const needsRefresh = !destOk || previousDeploy !== currentDeploy;

  if (needsRefresh && seeded) {
    fs.copyFileSync(seeded, dest);
    fs.writeFileSync(marker, currentDeploy);
  }
  return dest;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqlitePath() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;
