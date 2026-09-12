import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDemoReady } from "@/lib/seed-demo";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function withDemoSeed(request: Request) {
  await ensureDemoReady(prisma);
  if (request.method === "GET") return handler.GET(request);
  return handler.POST(request);
}

export const GET = withDemoSeed;
export const POST = withDemoSeed;
