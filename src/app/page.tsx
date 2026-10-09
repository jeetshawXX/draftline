import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bookmark, MoveUpRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 7,
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, category: true, publishedAt: true, author: { select: { name: true } } }
  });
  const featured = posts[0];
  const remaining = posts.slice(1);

  return <div className="public-site">
    <SiteHeader />
    <main>
      <section className="home-hero page-wrap">
        <div className="home-hero-copy">
          <span className="eyebrow"><Sparkles size={13} /> A JOURNAL FOR THE CURIOUS</span>
          <h1>Good ideas<br />grow <em>here.</em></h1>
          <p>A little corner of the internet for thoughtful notes on design, technology, and the art of making things that matter.</p>
          <div className="hero-actions">
            <Link href="#latest" className="button button-dark">Explore the journal <ArrowDownRight size={16} /></Link>
            <span className="hero-note">Made for minds that wander.</span>
          </div>
        </div>
        <div className="home-hero-art">
          <div className="art-backdrop" />
          <div className="art-card art-card-top">
            <span className="art-card-label">FIELD NOTE NO. 08</span>
            <div className="art-line art-line-long" /><div className="art-line" />
            <div className="art-mini-grid"><span /><span /><span /></div>
          </div>
          <div className="art-card art-card-bottom"><span className="art-note-mark">✳</span><div><strong>Stay curious.</strong><small>Keep making things.</small></div></div>
          <div className="art-orbit orbit-a" /><div className="art-orbit orbit-b" />
          <span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✴</span>
          <div className="art-number">01 <span>— 07</span></div>
        </div>
      </section>
      <div className="home-marquee"><div className="marquee-inner"><span>THOUGHTFUL BY DESIGN</span><i>✳</i><span>BUILT FOR THE CURIOUS</span><i>✳</i><span>ALWAYS IN PROGRESS</span><i>✳</i><span>THOUGHTFUL BY DESIGN</span></div></div>
      <section className="latest-section page-wrap" id="latest">
        <div className="section-heading">
          <div><span className="eyebrow">THE LATEST NOTES</span><h2>Stories worth<br className="mobile-break" /> your time<span className="title-period">.</span></h2></div>
          <div className="section-heading-right"><p>Ideas, observations, and a few useful things we’ve learned along the way.</p><span className="post-count-label">{posts.length.toString().padStart(2, "0")} STORIES</span></div>
        </div>
        {posts.length === 0 ? <div className="public-empty"><span className="empty-icon"><Bookmark size={22} /></span><h3>The first chapter is still being written.</h3><p>Come back soon for new stories.</p></div> : (
          <div className="story-layout">
            {featured && <article className="featured-story">
              <Link href={`/blog/${featured.slug}`} className="featured-image story-image">
                {featured.coverImage ? <img src={featured.coverImage} alt="" /> : <div className="story-image-placeholder"><span>✳</span></div>}
                <span className="image-arrow"><MoveUpRight size={19} /></span>
              </Link>
              <div className="story-meta"><span>{featured.category}</span><i>·</i><span>{formatDate(featured.publishedAt)}</span></div>
              <h3><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h3>
              <p>{featured.excerpt}</p>
              <Link href={`/blog/${featured.slug}`} className="read-link">Read the story <ArrowRight size={15} /></Link>
            </article>}
            <div className="story-list">
              {remaining.length ? remaining.map((post, index) => <article className="story-list-item" key={post.id}>
                <Link href={`/blog/${post.slug}`} className="story-list-image">
                  {post.coverImage ? <img src={post.coverImage} alt="" loading="lazy" /> : <div className="story-image-placeholder"><span>✳</span></div>}
                  <span className="mini-image-number">0{index + 2}</span>
                </Link>
                <div className="story-list-content">
                  <div className="story-meta"><span>{post.category}</span><i>·</i><span>{formatDate(post.publishedAt)}</span></div>
                  <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
                  <p>{post.excerpt}</p>
                  <Link href={`/blog/${post.slug}`} className="read-link">Read story <ArrowUpRight size={14} /></Link>
                </div>
              </article>) : <div className="more-stories-empty"><p>More stories are on the way.</p><span>Keep your curiosity close.</span></div>}
            </div>
          </div>
        )}
      </section>
      <section className="home-cta"><div className="home-cta-inner page-wrap"><div><span className="eyebrow light-eyebrow">YOUR TURN TO MAKE</span><h2>Every good story<br />starts somewhere<span>.</span></h2><p>Have an idea that’s asking to be shared? This space is yours to build.</p></div><Link href="/admin/login" className="button button-lime">Open the studio <ArrowUpRight size={16} /></Link><span className="cta-decor">✳</span></div></section>
    </main>
    <footer className="site-footer page-wrap"><Link href="/" className="brand"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span></span></Link><span>A journal for the curious.</span><div className="footer-links"><Link href="/p/our-studio">Our studio</Link><Link href="/admin/login">Admin</Link><a href="https://github.com/" target="_blank" rel="noreferrer">Built with intention ↗</a></div><small>© {new Date().getFullYear()} Draftline Studio</small></footer>
  </div>;
}
