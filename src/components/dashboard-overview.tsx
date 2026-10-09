"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, Clock3, FilePlus2, FileText, FolderOpen, PenLine, Plus, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Overview = { stats: { posts: number; publishedPosts: number; draftPosts: number; pages: number; media: number }; recentPosts: { id: string; title: string; slug: string; status: string; updatedAt: string; category: string }[] };

export function DashboardOverview() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/overview", { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Could not load the dashboard.");
      setData(result);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load the dashboard."));
  }, [router]);
  const greeting = "Welcome back";

  return <div className="content-page dashboard-page">
    <div className="dashboard-welcome"><div><div className="page-kicker">YOUR WORKSPACE · DRAFTLINE JOURNAL</div><h1>{greeting}, Jeet<span className="title-period">.</span></h1><p>Make a little room for a big idea today.</p></div><div className="welcome-decoration"><div className="welcome-ring ring-one" /><div className="welcome-ring ring-two" /><span>✳</span></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="dashboard-section-top"><div><h2>Your workspace</h2><p>A little overview of what you have been making.</p></div><Link href="/admin/posts/new" className="button button-dark"><Plus size={16} /> New post</Link></div>
    <div className="dashboard-metrics"><div className="dashboard-metric featured-metric"><div className="metric-top"><span>Total posts</span><span className="metric-icon mint-icon"><BookOpen size={17} /></span></div><strong>{data?.stats.posts ?? "—"}</strong><div className="metric-bottom"><span>Stories in your journal</span><Link href="/admin/posts" aria-label="Browse posts"><ArrowUpRight size={15} /></Link></div></div><div className="dashboard-metric"><div className="metric-top"><span>Published</span><span className="metric-icon green-icon"><CheckCircle2 size={17} /></span></div><strong>{data?.stats.publishedPosts ?? "—"}</strong><div className="metric-bottom"><span>Live for readers</span><span className="metric-small-dot" /></div></div><div className="dashboard-metric"><div className="metric-top"><span>Drafts</span><span className="metric-icon yellow-icon"><Clock3 size={17} /></span></div><strong>{data?.stats.draftPosts ?? "—"}</strong><div className="metric-bottom"><span>Still taking shape</span><span className="metric-small-dot yellow-dot" /></div></div><div className="dashboard-metric"><div className="metric-top"><span>Pages</span><span className="metric-icon violet-icon"><FileText size={17} /></span></div><strong>{data?.stats.pages ?? "—"}</strong><div className="metric-bottom"><span>Custom page layouts</span><Link href="/admin/pages" aria-label="Browse pages"><ArrowUpRight size={15} /></Link></div></div></div>
    <div className="dashboard-two-column"><section className="data-panel recent-panel"><div className="panel-heading"><div><h2>Recently updated</h2><p>Your most recent editorial work</p></div><Link href="/admin/posts" className="text-link">View all <ArrowRight size={15} /></Link></div>{!data ? <div className="table-state">Loading recent activity…</div> : data.recentPosts.length === 0 ? <div className="recent-empty"><FilePlus2 size={22} /><h3>A blank page is full of possibilities.</h3><p>Create your first post to get started.</p><Link href="/admin/posts/new" className="text-link">Start writing <ArrowRight size={14} /></Link></div> : <div className="recent-post-list">{data.recentPosts.map((post) => <Link href={`/admin/posts/${post.id}`} className="recent-post-row" key={post.id}><span className={`recent-post-icon ${post.status === "PUBLISHED" ? "recent-live" : "recent-draft"}`}>{post.status === "PUBLISHED" ? <BookOpen size={16} /> : <PenLine size={16} />}</span><span className="recent-post-main"><strong>{post.title}</strong><small>{post.category} · {formatDate(post.updatedAt)}</small></span><span className={`status-pill ${post.status === "PUBLISHED" ? "published" : "draft"}`}><i />{post.status === "PUBLISHED" ? "Published" : "Draft"}</span><ArrowRight size={15} className="recent-arrow" /></Link>)}</div>}<div className="panel-footer"><span>Keep your best ideas moving.</span><span><Sparkles size={14} /> Draftline Studio</span></div></section>
      <section className="quick-actions-panel"><div className="quick-actions-heading"><span className="quick-spark"><Sparkles size={18} /></span><div><h2>Make something</h2><p>Shortcuts to your next step.</p></div></div><div className="quick-action-list"><Link href="/admin/posts/new" className="quick-action"><span className="quick-action-icon icon-green"><PenLine size={17} /></span><span><strong>Write a story</strong><small>Start a new post from scratch</small></span><ArrowRight size={16} /></Link><Link href="/admin/pages/new" className="quick-action"><span className="quick-action-icon icon-yellow"><LayoutDashboardIcon /></span><span><strong>Design a page</strong><small>Build with movable sections</small></span><ArrowRight size={16} /></Link><Link href="/admin/media" className="quick-action"><span className="quick-action-icon icon-violet"><FolderOpen size={17} /></span><span><strong>Manage media</strong><small>Upload and organize images</small></span><ArrowRight size={16} /></Link></div><div className="quick-note"><span>✳</span><p><strong>Design with intention.</strong> A clear hierarchy makes every page easier to explore.</p></div></section></div>
  </div>;
}

function LayoutDashboardIcon() {
  return <FileText size={17} />;
}
