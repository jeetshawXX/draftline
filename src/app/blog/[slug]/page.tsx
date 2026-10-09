import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { cleanRichText } from "@/lib/sanitize";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({ where: { slug, status: "PUBLISHED" }, select: { title: true, seoTitle: true, seoDescription: true, excerpt: true, coverImage: true } });
  if (!post) return { title: "Story not found" };
  return { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, openGraph: { title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, images: post.coverImage ? [post.coverImage] : [] } };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await prisma.post.findFirst({ where: { slug, status: "PUBLISHED" }, include: { author: { select: { name: true } } } });
  if (!post) notFound();
  const related = await prisma.post.findMany({ where: { status: "PUBLISHED", id: { not: post.id } }, orderBy: { publishedAt: "desc" }, take: 2, select: { title: true, slug: true, category: true, excerpt: true, coverImage: true } });
  const readingMinutes = Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length / 220));
  return <div className="public-site"><SiteHeader /><main className="article-page page-wrap"><Link href="/#latest" className="article-back"><ArrowLeft size={15} /> Back to all stories</Link><article><header className="article-header"><div className="story-meta article-meta"><span>{post.category}</span><i>·</i><span>{formatDate(post.publishedAt)}</span><i>·</i><span><Clock3 size={13} /> {readingMinutes} min read</span></div><h1>{post.title}</h1><p className="article-deck">{post.excerpt}</p><div className="article-byline"><div className="byline-avatar">{post.author.name[0]?.toUpperCase()}</div><div><strong>{post.author.name}</strong><span>Contributor · Draftline Journal</span></div></div></header>{post.coverImage && <figure className="article-cover"><img src={post.coverImage} alt="" /></figure>}<div className="article-content"><div className="article-content-side"><span>IN THIS STORY</span><p>A few thoughts, carefully considered.</p><div className="article-share-mark">✳</div></div><div className="rich-content" dangerouslySetInnerHTML={{ __html: cleanRichText(post.content) }} /></div></article>{related.length > 0 && <section className="related-stories"><div className="related-heading"><span className="eyebrow">KEEP EXPLORING</span><h2>More to discover<span>.</span></h2></div><div className="related-grid">{related.map((item) => <Link className="related-card" key={item.slug} href={`/blog/${item.slug}`}><div className="related-image">{item.coverImage ? <img src={item.coverImage} alt="" loading="lazy" /> : <span>✳</span>}<ArrowUpRight size={18} /></div><span className="related-category">{item.category}</span><h3>{item.title}</h3><p>{item.excerpt}</p></Link>)}</div></section>}</main><footer className="site-footer page-wrap"><Link href="/" className="brand"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span></span></Link><span>A journal for the curious.</span><div className="footer-links"><Link href="/p/our-studio">Our studio</Link><Link href="/admin/login">Admin</Link></div><small>© {new Date().getFullYear()} Draftline Studio</small></footer></div>;
}
