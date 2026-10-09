"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ExternalLink, Eye, LoaderCircle, Save, Settings2 } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { makeSlug } from "@/lib/utils";

type Draft = { title: string; slug: string; excerpt: string; content: string; coverImage: string; category: string; status: "DRAFT" | "PUBLISHED"; seoTitle: string; seoDescription: string };
const emptyDraft: Draft = { title: "", slug: "", excerpt: "", content: "<p>Start writing your story…</p>", coverImage: "", category: "Product & Design", status: "DRAFT", seoTitle: "", seoDescription: "" };

export function PostEditor({ mode }: { mode: "new" | "edit" }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = mode === "edit" ? params.id : undefined;
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetch(`/api/posts/${id}`, { cache: "no-store" }).then(async (response) => {
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Could not load post.");
      if (!alive) return;
      setDraft({ title: result.post.title, slug: result.post.slug, excerpt: result.post.excerpt || "", content: result.post.content || "", coverImage: result.post.coverImage || "", category: result.post.category || "Uncategorized", status: result.post.status, seoTitle: result.post.seoTitle || "", seoDescription: result.post.seoDescription || "" });
      setSlugEdited(true);
    }).catch((err) => { if (alive) setError(err instanceof Error ? err.message : "Could not load post."); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, router]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateTitle = (value: string) => setDraft((current) => ({ ...current, title: value, slug: slugEdited ? current.slug : makeSlug(value), seoTitle: current.seoTitle ? current.seoTitle : value }));

  async function save(event?: FormEvent<HTMLFormElement>, statusOverride?: Draft["status"]) {
    event?.preventDefault();
    if (!draft.title.trim()) { setError("Give your post a title before saving."); return; }
    setSaving(true); setError(""); setNotice("");
    const payload = { ...draft, status: statusOverride || draft.status, slug: draft.slug.trim() || makeSlug(draft.title) };
    try {
      const response = await fetch(mode === "edit" ? `/api/posts/${id}` : "/api/posts", { method: mode === "edit" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Could not save this post.");
      setDraft((current) => ({ ...current, status: result.post.status, slug: result.post.slug }));
      setSlugEdited(true);
      setNotice(statusOverride === "PUBLISHED" ? "Your story is live." : "Your changes are saved.");
      if (mode === "new") router.replace(`/admin/posts/${result.post.id}`);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save this post."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="editor-page-loading"><LoaderCircle size={20} className="spin" /> Loading your post…</div>;

  return <form className="post-editor-page" onSubmit={(event) => save(event)}>
    <div className="editor-page-top"><Link href="/admin/posts" className="back-link"><ArrowLeft size={16} /> All posts</Link><div className="editor-top-actions"><span className={`status-pill ${draft.status === "PUBLISHED" ? "published" : "draft"}`}><i />{draft.status === "PUBLISHED" ? "Published" : "Draft"}</span><button type="submit" className="button button-outline" disabled={saving}><Save size={16} /> Save changes</button><button type="button" className="button button-dark" disabled={saving} onClick={() => void save(undefined, "PUBLISHED")}><Check size={16} /> {draft.status === "PUBLISHED" ? "Update post" : "Publish"}</button></div></div>
    <div className="editor-title-area"><div className="page-kicker">EDITORIAL WORKSPACE / {mode === "new" ? "NEW POST" : "EDIT POST"}</div><input className="post-title-input" value={draft.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Your story starts here…" maxLength={180} aria-label="Post title" /><div className="title-input-footer"><span>Give your post a clear, memorable title.</span><span>{draft.title.length}/180</span></div></div>
    {error && <div className="inline-error" role="alert">{error}</div>}{notice && <div className="inline-success" role="status">{notice}</div>}
    <div className="editor-layout"><div className="editor-main-column">
      <section className="editor-card"><div className="editor-card-heading"><div><h2>Story</h2><p>Write the story the way you want it to read.</p></div><span className="editor-card-icon"><Settings2 size={17} /></span></div><RichTextEditor value={draft.content} onChange={(value) => set("content", value)} /></section>
      <section className="editor-card"><div className="editor-card-heading"><div><h2>Excerpt</h2><p>A short introduction for cards and search results.</p></div><span className="character-count">{draft.excerpt.length}/500</span></div><textarea className="form-textarea" value={draft.excerpt} onChange={(event) => set("excerpt", event.target.value)} rows={3} maxLength={500} placeholder="Tell readers what this story is about…" /></section>
      <section className="editor-card"><button type="button" className="collapsible-heading" onClick={() => setShowSeo((value) => !value)}><span><h2>Search preview</h2><small>SEO title and description</small></span><ChevronDown size={17} className={showSeo ? "rotate-180" : ""} /></button>{showSeo && <div className="seo-fields"><label className="form-field"><span>SEO title</span><input value={draft.seoTitle} onChange={(event) => set("seoTitle", event.target.value)} maxLength={180} placeholder={draft.title || "A descriptive page title"} /></label><label className="form-field"><span>Meta description</span><textarea value={draft.seoDescription} onChange={(event) => set("seoDescription", event.target.value)} rows={3} maxLength={300} placeholder="A helpful summary for search engines…" /></label></div>}</section>
    </div><aside className="editor-side-column">
      <section className="editor-card sidebar-editor-card"><div className="editor-card-heading"><div><h2>Publish</h2><p>Control who can read this.</p></div><span className="editor-card-icon"><Eye size={17} /></span></div><div className="publish-status-row"><span>Status</span><select value={draft.status} onChange={(event) => set("status", event.target.value as Draft["status"])}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></div><p className="helper-copy">{draft.status === "PUBLISHED" ? "This story is visible to anyone who has its link." : "Drafts are private until you publish them."}</p><button type="submit" className="button button-dark full-button" disabled={saving}>{saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}{saving ? "Saving…" : "Save changes"}</button></section>
      <section className="editor-card sidebar-editor-card"><div className="editor-card-heading"><div><h2>Details</h2><p>Help readers find your work.</p></div></div><label className="form-field"><span>URL slug</span><div className="slug-input-wrap"><span>/</span><input value={draft.slug} onChange={(event) => { setSlugEdited(true); set("slug", makeSlug(event.target.value)); }} maxLength={100} placeholder="your-story-slug" /></div></label><label className="form-field"><span>Category</span><select value={draft.category} onChange={(event) => set("category", event.target.value)}><option>Product & Design</option><option>Design Systems</option><option>Engineering</option><option>Culture</option><option>Ideas</option><option>Uncategorized</option></select></label><label className="form-field"><span>Cover image URL</span><input value={draft.coverImage} onChange={(event) => set("coverImage", event.target.value)} maxLength={1000} placeholder="https://… or /uploads/image.jpg" /></label>{draft.coverImage && <div className="cover-preview"><img src={draft.coverImage} alt="Cover image preview" /></div>}<Link href="/admin/media" className="text-link small-text-link">Browse media library <ExternalLink size={13} /></Link></section>
      <div className="editor-side-note"><span className="note-sparkle">✳</span><p><strong>A little editorial tip</strong> Keep paragraphs focused and use headings to help readers scan long stories.</p></div>
    </aside></div>
    <div className="bottom-editor-actions"><Link href="/admin/posts" className="text-link">Discard and return</Link><div><button type="submit" className="button button-outline" disabled={saving}>Save changes</button><button type="button" className="button button-dark" disabled={saving} onClick={() => void save(undefined, "PUBLISHED")}>{saving ? "Saving…" : "Publish story ↗"}</button></div></div>
  </form>;
}
