import { ContentStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cleanPlainText } from "@/lib/sanitize";
import { makeSlug } from "@/lib/utils";

export const runtime = "nodejs";
const blockSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(["hero", "text", "image", "features", "cta"]),
  data: z.record(z.string(), z.unknown())
});
const pageSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  layout: z.array(blockSchema).max(40),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(300).optional()
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  const search = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) || "";
  const where: Prisma.PageWhereInput = auth.user ? {} : { status: ContentStatus.PUBLISHED };
  if (search) where.title = { contains: search };
  const pages = await prisma.page.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, title: true, slug: true, status: true, updatedAt: true, createdAt: true } });
  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = pageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the page details.", details: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const slug = makeSlug(data.slug || data.title);
  if (await prisma.page.findUnique({ where: { slug } })) return NextResponse.json({ error: "That page URL is already in use." }, { status: 409 });
  const page = await prisma.page.create({ data: { title: data.title, slug, status: data.status as ContentStatus, layout: JSON.stringify(data.layout), seoTitle: cleanPlainText(data.seoTitle, 180), seoDescription: cleanPlainText(data.seoDescription, 300) } });
  return NextResponse.json({ page }, { status: 201 });
}
