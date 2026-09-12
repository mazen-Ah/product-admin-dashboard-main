import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await ctx.params;
  if (!parts?.length || parts.some((p) => p.includes(".."))) {
    return new NextResponse("Not found", { status: 404 });
  }
  const filePath = path.join(process.cwd(), "uploads", "bons", ...parts);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
