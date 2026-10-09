import { unlink } from "node:fs/promises";
import path from "node:path";
import { uploadDirectory } from "@/lib/uploads";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanPlainText } from "@/lib/sanitize";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = z.object({ altText: z.string().max(300) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Alt text must be under 300 characters." }, { status: 400 });
  const media = await prisma.media.update({ where: { id }, data: { altText: cleanPlainText(parsed.data.altText, 300) } }).catch(() => null);
  if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  return NextResponse.json({ media });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "Media item not found." }, { status: 404 });
  await prisma.media.delete({ where: { id } });
  try { await unlink(path.join(uploadDirectory(), media.filename)); } catch { /* Database entry removal should succeed even if the file is already gone. */ }
  return NextResponse.json({ ok: true });
}
