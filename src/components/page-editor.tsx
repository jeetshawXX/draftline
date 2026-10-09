"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ExternalLink, LoaderCircle, Save } from "lucide-react";
import { PageBuilder } from "@/components/page-builder";
import type { PageBlock } from "@/types/cms";
import { makeSlug } from "@/lib/utils";

type PageDraft = { title: string; slug: string; status: "DRAFT" | "PUBLISHED"; layout: PageBlock[]; seoTitle: string; seoDescription: string };
const blank: PageDraft = { title: "", slug: "", status: "DRAFT", layout: [], seoTitle: "", seoDescription: "" };

export function PageEditor({ mode }: { mode: "new" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = mode === "edit" ? params.id : undefined;
  const [draft, setDraft] = useState<PageDraft>(blank);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/pages/${id}`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Could not load page.");
      if (!alive) return;
      setDraft({ title: result.page.title, slug: result.page.slug, status: result.page.status, layout: result.page.layout || [], seoTitle: result.page.seoTitle || "", seoDescription: result.page.seoDescription || "" });
      setSlugEdited(true);
    }).catch((reason) => { if (alive) setError(reason instanceof Error ? reason.message : "Could not load page."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, router]);

  const set = <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  async function save(event?: FormEvent<HTMLFormElement>, statusOverride?: PageDraft["status"]) {
    event?.preventDefault();
    if (!draft.title.trim()) { setError("Give your page a title before saving."); return; }
    if (draft.layout.length === 0 && !window.confirm("This page has no sections. Save it as an empty page?")) return;
    setSaving(true); setError(""); setNotice("");
    const payload = { ...draft, status: statusOverride || draft.status, slug: draft.slug.trim() || makeSlug(draft.title) };
    try {
      const response = await fetch(mode === "edit" ? `/api/pages/${id}` : "/api/pages", { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Could not save page.");
      setDraft((current) => ({ ...current, status: result.page.status, slug: result.page.slug })); setSlugEdited(true);
      setNotice(statusOverride === "PUBLISHED" ? "Your page is live." : "Your changes are saved.");
      if (mode === "new") router.replace(`/admin/pages/${result.page.id}`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save page."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="editor-page-loading"><LoaderCircle size={20} className="spin" /> Loading your page…</div>;
  return <form className="page-edit-screen" onSubmit={(event) => void save(event)}>
    <div className="editor-page-top"><Link href="/admin/pages" className="back-link"><ArrowLeft size={16} /> All pages</Link><div className="editor-top-actions"><span className={`status-pill ${draft.status === "PUBLISHED" ? "published" : "draft"}`}><i />{draft.status === "PUBLISHED" ? "Published" : "Draft"}</span><button type="submit" className="button button-outline" disabled={saving}><Save size={16} /> Save changes</button><button type="button" className="button button-dark" disabled={saving} onClick={() => void save(undefined, "PUBLISHED")}><Check size={16} /> Publish page</button></div></div>
    <div className="page-title-row page-edit-title"><div><div className="page-kicker">VISUAL PAGE BUILDER / {mode === "new" ? "NEW PAGE" : "EDIT PAGE"}</div><input className="page-title-input" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: slugEdited ? current.slug : makeSlug(event.target.value), seoTitle: current.seoTitle || event.target.value }))} placeholder="Untitled page" maxLength={180} /><p>Arrange sections to design your public website page.</p></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}{notice && <div className="inline-success" role="status">{notice}</div>}
    <div className="page-builder-layout"><div className="page-builder-main"><PageBuilder value={draft.layout} onChange={(layout) => set("layout", layout)} /></div><aside className="page-builder-sidebar"><section className="editor-card sidebar-editor-card"><div className="editor-card-heading"><div><h2>Page settings</h2><p>Address and visibility.</p></div></div><label className="form-field"><span>URL slug</span><div className="slug-input-wrap"><span>/p/</span><input value={draft.slug} onChange={(event) => { setSlugEdited(true); set("slug", makeSlug(event.target.value)); }} maxLength={100} placeholder="page-name" /></div></label><label className="form-field"><span>Visibility</span><select value={draft.status} onChange={(event) => set("status", event.target.value as PageDraft["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label><button type="button" className="collapsible-heading seo-toggle" onClick={() => setShowSeo((v) => !v)}><span><strong>Search preview</strong><small>SEO settings</small></span><ExternalLink size={15} /></button>{showSeo && <div className="seo-fields"><label className="form-field"><span>SEO title</span><input value={draft.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} maxLength={180} /></label><label className="form-field"><span>Meta description</span><textarea value={draft.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} rows={3} maxLength={300} /></label></div>}{draft.status === "PUBLISHED" && <Link href={`/p/${draft.slug}`} target="_blank" className="text-link small-text-link">View live page <ExternalLink size={13} /></Link>}</section><div className="editor-side-note"><span className="note-sparkle">✳</span><p><strong>Make it flow.</strong> Start with a strong hero, follow with useful content, and finish with a clear next step.</p></div></aside></div>
    <div className="bottom-editor-actions"><Link href="/admin/pages" className="text-link">Discard and return</Link><div><button type="submit" className="button button-outline" disabled={saving}>Save changes</button><button type="button" className="button button-dark" disabled={saving} onClick={() => void save(undefined, "PUBLISHED")}>{saving ? "Saving…" : "Publish page ↗"}</button></div></div>
  </form>;
}
