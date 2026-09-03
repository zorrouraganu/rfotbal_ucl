import { NextRequest, NextResponse } from "next/server";
import { buildAppUrl } from "@/lib/appUrl";
import { deleteCurrentSession } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  await deleteCurrentSession();
  return NextResponse.redirect(buildAppUrl("/login", request.url), 303);
}
