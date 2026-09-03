import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, competition: "ucl-2026-27", mode: process.env.LIVE_SCORE_PROVIDER ?? "manual", version: process.env.APP_VERSION ?? "dev" });
  } catch {
    return NextResponse.json({ ok: false, competition: "ucl-2026-27" }, { status: 503 });
  }
}
