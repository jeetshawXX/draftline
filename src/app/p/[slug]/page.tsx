import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PageBlock } from "@/types/cms";
import { BlockRenderer } from "@/components/block-renderer";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, seoTitle: true, seoDescription: true } });
  if (!page) return { title: "Page not found" };
  return { title: page.seoTitle || page.title, description: page.seoDescription || undefined };
}

export default async function CustomPage({ params }: Params) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } });
  if (!page) notFound();
  let blocks: PageBlock[] = [];
  try { blocks = JSON.parse(page.layout) as PageBlock[]; } catch { blocks = []; }
  return <div className="public-site"><SiteHeader /><main><div className="custom-page-top page-wrap"><Link href="/" className="article-back">← Back home</Link><span className="custom-page-label">DRAFTLINE / {page.title.toUpperCase()}</span></div><BlockRenderer blocks={blocks} /></main><footer className="site-footer page-wrap"><Link href="/" className="brand"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span></span></Link><span>A journal for the curious.</span><div className="footer-links"><Link href="/#latest">Journal</Link><Link href="/admin/login">Admin</Link></div><small>© {new Date().getFullYear()} Draftline Studio</small></footer></div>;
}
