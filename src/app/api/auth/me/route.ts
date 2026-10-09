import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  return NextResponse.json({ user: auth.user });
}
