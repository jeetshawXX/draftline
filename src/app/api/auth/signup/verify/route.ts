import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
const schema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(200),
});
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email, six-digit code, and password of at least 8 characters." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const pending = await prisma.emailVerificationCode.findUnique({ where: { email } });
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    if (pending) await prisma.emailVerificationCode.delete({ where: { email } });
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  }
  if (pending.attempts >= 5) {
    await prisma.emailVerificationCode.delete({ where: { email } });
    return NextResponse.json({ error: "Too many incorrect codes. Request a new one." }, { status: 429 });
  }
  if (hash(parsed.data.code) !== pending.codeHash) {
    await prisma.emailVerificationCode.update({ where: { email }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "That verification code is incorrect." }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.emailVerificationCode.deleteMany({ where: { email } });
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }
  const user = await prisma.user.create({
    data: { name: pending.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "ADMIN" },
    select: { id: true, name: true, email: true, role: true }
  });
  await prisma.emailVerificationCode.deleteMany({ where: { email } });
  const token = await createSession(user);
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
