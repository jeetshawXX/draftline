import { NextRequest, NextResponse } from "next/server";
import { ContentStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response || !auth.user) return auth.response ?? NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const [posts, publishedPosts, draftPosts, pages, media, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: ContentStatus.PUBLISHED } }),
    prisma.post.count({ where: { status: ContentStatus.DRAFT } }),
    prisma.page.count(),
    prisma.media.count(),
    prisma.post.findMany({ orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, slug: true, status: true, updatedAt: true, category: true } })
  ]);
  return NextResponse.json({ stats: { posts, publishedPosts, draftPosts, pages, media }, recentPosts });
}
