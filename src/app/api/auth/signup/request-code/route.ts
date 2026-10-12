import { NextRequest, NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254) });
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return NextResponse.json({ error: "Email verification is not configured yet. Set RESEND_API_KEY and EMAIL_FROM in your deployment environment." }, { status: 503 });

  const recent = await prisma.emailVerificationCode.findUnique({ where: { email } });
  if (recent && Date.now() - recent.createdAt.getTime() < 60_000) {
    return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 });
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.emailVerificationCode.upsert({
    where: { email },
    create: { email, name, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000), attempts: 0 },
    update: { name, codeHash: hash(code), expiresAt: new Date(Date.now() + 10 * 60_000), attempts: 0, createdAt: new Date() }
  });
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [email], subject: "Your Draftline verification code",
      text: `Hi ${name}, your Draftline verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#20231c"><h1>Welcome to Draftline</h1><p>Use this code to verify your email address:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p></div>`
    })
  });
  if (!sent.ok) {
    await prisma.emailVerificationCode.deleteMany({ where: { email } });
    return NextResponse.json({ error: "We couldn't send the verification email. Check your email provider configuration and try again." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, message: "Verification code sent. Check your inbox." });
}
