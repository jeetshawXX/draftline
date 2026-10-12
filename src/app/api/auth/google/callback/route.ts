import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || new URL(request.url).origin;
  const loginUrl = new URL("/admin/login", siteUrl);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("draftline_oauth_state")?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !state || !savedState || state !== savedState || !clientId || !clientSecret) {
    loginUrl.searchParams.set("error", "google_auth_failed");
    return NextResponse.redirect(loginUrl);
  }
  try {
    const callback = new URL("/api/auth/google/callback", siteUrl).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callback, grant_type: "authorization_code" })
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new Error("Google access token missing");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileResponse.ok) throw new Error("Google profile fetch failed");
    const profile = await profileResponse.json() as { email?: string; name?: string; verified_email?: boolean };
    if (!profile.email || profile.verified_email !== true) throw new Error("Google email not verified");
    const email = profile.email.toLowerCase();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { name: profile.name?.trim() || email.split("@")[0], email, passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12), role: "ADMIN" } });
    }
    const token = await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    const response = NextResponse.redirect(new URL("/admin", siteUrl));
    response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 7 });
    response.cookies.set("draftline_oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    loginUrl.searchParams.set("error", "google_auth_failed");
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("draftline_oauth_state", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  }
}
