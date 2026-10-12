import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
  if (!clientId || !siteUrl) return NextResponse.redirect(new URL("/admin/login?error=google_not_configured", request.url));
  const state = randomBytes(24).toString("hex");
  const callback = new URL("/api/auth/google/callback", siteUrl).toString();
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.search = new URLSearchParams({ client_id: clientId, redirect_uri: callback, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
  const response = NextResponse.redirect(target);
  response.cookies.set("draftline_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
