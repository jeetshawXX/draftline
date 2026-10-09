import { ContentStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanPlainText, cleanRichText } from "@/lib/sanitize";
import { makeSlug } from "@/lib/utils";

export const runtime = "nodejs";
const postSchema = z.object({
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

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi(request);
  const search = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) || "";
  const status = request.nextUrl.searchParams.get("status");
  const where: Prisma.PostWhereInput = {};
  if (!admin.user) where.status = ContentStatus.PUBLISHED;
  else if (status === "DRAFT" || status === "PUBLISHED") where.status = status;
  if (search) where.OR = [{ title: { contains: search } }, { excerpt: { contains: search } }, { category: { contains: search } }];
  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, category: true, status: true, publishedAt: true, updatedAt: true, author: { select: { name: true } } }
  });
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the title and field lengths.", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const slug = makeSlug(data.slug || data.title);
  const exists = await prisma.post.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: "That URL slug is already in use. Choose another one." }, { status: 409 });
  const status = data.status as ContentStatus;
  const post = await prisma.post.create({
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
      publishedAt: status === ContentStatus.PUBLISHED ? new Date() : null,
      authorId: auth.user.id
    }
  });
  return NextResponse.json({ post }, { status: 201 });
}
