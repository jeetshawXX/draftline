import { ContentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanPlainText } from "@/lib/sanitize";
import { makeSlug } from "@/lib/utils";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };
const blockSchema = z.object({ id: z.string().min(1).max(100), type: z.enum(["hero", "text", "image", "features", "cta"]), data: z.record(z.string(), z.unknown()) });
const schema = z.object({ title: z.string().trim().min(1).max(180), slug: z.string().trim().max(100).optional().or(z.literal("")), status: z.enum(["DRAFT", "PUBLISHED"]), layout: z.array(blockSchema).max(40), seoTitle: z.string().max(180).optional(), seoDescription: z.string().max(300).optional() });

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAdminApi(request);
  const page = await prisma.page.findFirst({ where: auth.user ? { id } : { id, status: ContentStatus.PUBLISHED } });
  if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  let layout: unknown[] = [];
  try { layout = JSON.parse(page.layout); } catch { layout = []; }
  return NextResponse.json({ page: { ...page, layout } });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the page details.", details: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  const data = parsed.data;
  const slug = makeSlug(data.slug || data.title);
  const slugOwner = await prisma.page.findUnique({ where: { slug } });
  if (slugOwner && slugOwner.id !== id) return NextResponse.json({ error: "That page URL is already in use." }, { status: 409 });
  const page = await prisma.page.update({ where: { id }, data: { title: data.title, slug, status: data.status as ContentStatus, layout: JSON.stringify(data.layout), seoTitle: cleanPlainText(data.seoTitle, 180), seoDescription: cleanPlainText(data.seoDescription, 300) } });
  return NextResponse.json({ page });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  if (!(await prisma.page.findUnique({ where: { id }, select: { id: true } }))) return NextResponse.json({ error: "Page not found." }, { status: 404 });
  await prisma.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
