import { ContentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanPlainText, cleanRichText } from "@/lib/sanitize";
import { makeSlug } from "@/lib/utils";

export const runtime = "nodejs";
const schema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().max(100).optional().or(z.literal("")),
  excerpt: z.string().max(500).optional(),
  content: z.string().max(500000).optional(),
  coverImage: z.string().max(1000).optional(),
  category: z.string().max(80).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(300).optional()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const auth = await requireAdminApi(request);
  const post = await prisma.post.findFirst({ where: auth.user ? { id } : { id, status: ContentStatus.PUBLISHED }, include: { author: { select: { name: true } } } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the title and field lengths.", details: parsed.error.flatten() }, { status: 400 });
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  const data = parsed.data;
  const slug = makeSlug(data.slug || data.title);
  const slugOwner = await prisma.post.findUnique({ where: { slug } });
  if (slugOwner && slugOwner.id !== id) return NextResponse.json({ error: "That URL slug is already in use. Choose another one." }, { status: 409 });
  const status = data.status as ContentStatus;
  const post = await prisma.post.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      excerpt: cleanPlainText(data.excerpt, 500),
      content: cleanRichText(data.content || ""),
      coverImage: cleanPlainText(data.coverImage, 1000),
      category: cleanPlainText(data.category || "Uncategorized", 80) || "Uncategorized",
      status,
      seoTitle: cleanPlainText(data.seoTitle, 180),
      seoDescription: cleanPlainText(data.seoDescription, 300),
      publishedAt: status === ContentStatus.PUBLISHED ? existing.publishedAt || new Date() : null
    }
  });
  return NextResponse.json({ post });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id } = await params;
  const exists = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
