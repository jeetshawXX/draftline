import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "uct_cms_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: { id: string; email: string; name: string; role: string }) {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function getSessionFromToken(token?: string | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return {
      id: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "Admin",
      role: typeof payload.role === "string" ? payload.role : "ADMIN"
    };
  } catch {
    return null;
  }
}

export async function currentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getSessionFromToken(token);
  if (!session || session.role !== "ADMIN") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true }
  });
  return user?.role === "ADMIN" ? user : null;
}

export async function requireAdminApi(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await getSessionFromToken(token);
  if (!session || session.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!user || user.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { user, response: null };
}
