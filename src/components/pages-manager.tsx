"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Page = { id: string; title: string; slug: string; status: "DRAFT" | "PUBLISHED"; updatedAt: string; createdAt: string };

export function PagesManager() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pages${query ? `?q=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load pages.");
      setPages(result.pages); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load pages."); }
    finally { setLoading(false); }
  }, [query, router]);
  useEffect(() => { const timer = setTimeout(() => void load(), 150); return () => clearTimeout(timer); }, [load]);
  async function remove(page: Page) {
    if (!window.confirm(`Delete “${page.title}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not delete page."); return; }
    setPages((current) => current.filter((item) => item.id !== page.id));
  }

  return <div className="content-page"><div className="page-title-row"><div><div className="page-kicker">SHAPE YOUR WEBSITE</div><h1>Pages <span className="title-count">{pages.length}</span></h1><p>Build custom pages from reusable drag-and-drop sections.</p></div><Link href="/admin/pages/new" className="button button-dark"><Plus size={17} /> Create a page</Link></div>
    <section className="data-panel"><div className="panel-heading"><div><h2>All pages</h2><p>Custom page layouts and landing pages</p></div><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages…" /></label></div>{error && <div className="inline-error">{error}</div>}<div className="table-scroll"><table className="content-table"><thead><tr><th>PAGE</th><th>STATUS</th><th>CREATED</th><th>LAST UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{loading ? <tr><td colSpan={5}><div className="table-state">Loading pages…</div></td></tr> : pages.length === 0 ? <tr><td colSpan={5}><div className="table-state empty-state"><div className="empty-icon"><FileText size={22} /></div><h3>No pages yet</h3><p>Build a homepage, landing page, or about page with the visual builder.</p><Link href="/admin/pages/new" className="text-link">Create your first page <ArrowRight size={15} /></Link></div></td></tr> : pages.map((page) => <tr key={page.id}><td><div className="post-cell"><div className="post-thumb page-thumb"><FileText size={19} /></div><div className="post-cell-content"><Link className="post-title-link" href={`/admin/pages/${page.id}`}>{page.title}</Link><span className="post-slug">/p/{page.slug}</span></div></div></td><td><span className={`status-pill ${page.status === "PUBLISHED" ? "published" : "draft"}`}><i />{page.status === "PUBLISHED" ? "Published" : "Draft"}</span></td><td><span className="date-cell">{formatDate(page.createdAt)}</span></td><td><span className="date-cell">{formatDate(page.updatedAt)}</span></td><td><div className="row-actions"><Link href={`/admin/pages/${page.id}`} className="icon-button" title="Edit page"><ArrowRight size={16} /></Link><button type="button" className="icon-button danger-icon" title="Delete page" onClick={() => void remove(page)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div><div className="panel-footer"><span>{loading ? "Refreshing…" : `${pages.length} ${pages.length === 1 ? "page" : "pages"}`}</span><span>Visual page builder</span></div></section>
  </div>;
}
