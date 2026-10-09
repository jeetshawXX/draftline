"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownUp, ArrowRight, BookOpen, CheckCircle2, Clock3, FileText, Filter, Plus, Search, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Post = { id: string; title: string; slug: string; excerpt: string; coverImage: string; category: string; status: "DRAFT" | "PUBLISHED"; publishedAt: string | null; updatedAt: string; author?: { name: string } };

export function PostsManager() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("q", search.trim());
      if (status !== "ALL") query.set("status", status);
      const response = await fetch(`/api/posts?${query}`, { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load posts.");
      setPosts(data.posts);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load posts."); }
    finally { setLoading(false); }
  }, [search, status, router]);
  useEffect(() => { const timer = setTimeout(() => { void load(); }, 160); return () => clearTimeout(timer); }, [load]);
  const counts = useMemo(() => ({ all: posts.length, published: posts.filter((post) => post.status === "PUBLISHED").length, drafts: posts.filter((post) => post.status === "DRAFT").length }), [posts]);

  async function remove(post: Post) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setDeleting(post.id); setError("");
    try {
      const response = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete post.");
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (err) { setError(err instanceof Error ? err.message : "Could not delete post."); }
    finally { setDeleting(null); }
  }

  return <div className="content-page">
    <div className="page-title-row"><div><div className="page-kicker">YOUR WORDS, YOUR WORLD</div><h1>Posts <span className="title-count">{posts.length}</span></h1><p>Write, edit, and publish stories for your readers.</p></div><Link href="/admin/posts/new" className="button button-dark"><Plus size={17} /> Write a post</Link></div>
    <div className="metric-strip"><div className="metric-card"><span className="metric-icon mint-icon"><BookOpen size={18} /></span><div><small>Total posts</small><strong>{loading ? "—" : counts.all}</strong></div></div><div className="metric-card"><span className="metric-icon green-icon"><CheckCircle2 size={18} /></span><div><small>Published</small><strong>{loading ? "—" : counts.published}</strong></div></div><div className="metric-card"><span className="metric-icon yellow-icon"><Clock3 size={18} /></span><div><small>Drafts</small><strong>{loading ? "—" : counts.drafts}</strong></div></div></div>
    <section className="data-panel"><div className="panel-heading"><div><h2>All posts</h2><p>Your editorial workspace</p></div><div className="list-controls"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search posts…" /></label><label className="filter-select"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter posts"><option value="ALL">All statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Drafts</option></select></label></div></div>
      {error && <div className="inline-error" role="alert">{error}</div>}
      <div className="table-scroll"><table className="content-table"><thead><tr><th>POST</th><th>STATUS</th><th>CATEGORY</th><th>LAST UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5}><div className="table-state">Loading your posts…</div></td></tr> : posts.length === 0 ? <tr><td colSpan={5}><div className="table-state empty-state"><div className="empty-icon"><FileText size={22} /></div><h3>No posts found</h3><p>{search || status !== "ALL" ? "Try changing your search or filter." : "Your next great story starts with a blank page."}</p>{!search && <Link href="/admin/posts/new" className="text-link">Write your first post <ArrowRight size={15} /></Link>}</div></td></tr> : posts.map((post) => <tr key={post.id}><td><div className="post-cell"><div className="post-thumb">{post.coverImage ? <img src={post.coverImage} alt="" /> : <div className="thumb-fallback">{post.title.slice(0, 1)}</div>}</div><div className="post-cell-content"><Link href={`/admin/posts/${post.id}`} className="post-title-link">{post.title}</Link><span className="post-slug">/{post.slug}</span></div></div></td><td><span className={`status-pill ${post.status === "PUBLISHED" ? "published" : "draft"}`}><i />{post.status === "PUBLISHED" ? "Published" : "Draft"}</span></td><td><span className="category-chip">{post.category || "Uncategorized"}</span></td><td><span className="date-cell">{formatDate(post.updatedAt)}</span></td><td><div className="row-actions"><Link href={`/admin/posts/${post.id}`} className="icon-button" title="Edit post"><ArrowRight size={16} /></Link><button type="button" className="icon-button danger-icon" onClick={() => remove(post)} disabled={deleting === post.id} title="Delete post"><Trash2 size={15} /></button></div></td></tr>)}
      </tbody></table></div><div className="panel-footer"><span>{loading ? "Refreshing…" : `Showing ${posts.length} ${posts.length === 1 ? "story" : "stories"}`}</span><span><ArrowDownUp size={14} /> Sorted by recently updated</span></div>
    </section>
  </div>;
}
