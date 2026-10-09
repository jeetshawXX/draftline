"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clipboard, FileImage, ImagePlus, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type MediaItem = { id: string; filename: string; originalName: string; mimeType: string; size: number; url: string; altText: string; createdAt: string };
const humanBytes = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function MediaLibrary() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      if (response.status === 401) { router.replace("/admin/login"); return; }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load media.");
      setItems(result.media); setAltDrafts(Object.fromEntries(result.media.map((item: MediaItem) => [item.id, item.altText || ""]))); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load media."); }
    finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void load(); }, [load]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true); setError(""); setNotice("");
    const form = new FormData(); form.append("file", file); form.append("altText", file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    try {
      const response = await fetch("/api/media", { method: "POST", body: form });
      const result = await response.json();
      if (response.status === 401) { router.replace("/admin/login"); return; }
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      setItems((current) => [result.media, ...current]); setAltDrafts((current) => ({ ...current, [result.media.id]: result.media.altText })); setNotice(`${file.name} uploaded successfully.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setUploading(false); }
  }

  async function copyUrl(item: MediaItem) {
    const fullUrl = item.url.startsWith("http") ? item.url : `${window.location.origin}${item.url}`;
    try { await navigator.clipboard.writeText(fullUrl); setCopied(item.id); window.setTimeout(() => setCopied((current) => current === item.id ? null : current), 1800); }
    catch { setError("Clipboard permission was unavailable. Copy the URL shown in the preview field."); }
  }
  async function saveAlt(item: MediaItem) {
    const response = await fetch(`/api/media/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ altText: altDrafts[item.id] || "" }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not save alt text."); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? result.media : entry)); setNotice("Alternative text saved.");
  }
  async function remove(item: MediaItem) {
    if (!window.confirm(`Delete ${item.originalName}? If a post uses this image, its preview will be broken.`)) return;
    const response = await fetch(`/api/media/${item.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not delete media."); return; }
    setItems((current) => current.filter((entry) => entry.id !== item.id)); setNotice("Media item deleted.");
  }

  return <div className="content-page"><div className="page-title-row"><div><div className="page-kicker">YOUR VISUAL LIBRARY</div><h1>Media <span className="title-count">{items.length}</span></h1><p>Upload and reuse the images that bring your stories to life.</p></div><button type="button" className="button button-dark" onClick={() => inputRef.current?.click()} disabled={uploading}><Upload size={17} /> {uploading ? "Uploading…" : "Upload image"}</button><input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} /></div>
    <div className="media-upload-strip"><div className="upload-strip-icon"><ImagePlus size={21} /></div><div><strong>Drop a little color into your story.</strong><p>JPG, PNG, WEBP, or GIF · Up to 5 MB by default · Images are stored in your app's uploads folder.</p></div><button type="button" className="button button-outline" onClick={() => inputRef.current?.click()} disabled={uploading}>Choose file</button></div>
    {error && <div className="inline-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={15} /></button></div>}{notice && <div className="inline-success" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15} /></button></div>}
    {loading ? <div className="media-loading"><LoaderCircle size={20} className="spin" /> Loading your library…</div> : items.length === 0 ? <div className="data-panel media-empty"><span className="empty-icon"><FileImage size={22} /></span><h3>Your media library is ready.</h3><p>Upload your first image to use it in a post or page layout.</p><button className="button button-dark" onClick={() => inputRef.current?.click()}><Upload size={16} /> Upload first image</button></div> : <div className="media-grid">{items.map((item) => <article className="media-card" key={item.id}><div className="media-preview"><img src={item.url} alt={altDrafts[item.id] || ""} loading="lazy" /><div className="media-card-overlay"><button type="button" onClick={() => void copyUrl(item)} className="media-overlay-button">{copied === item.id ? <Check size={15} /> : <Clipboard size={15} />}{copied === item.id ? "Copied" : "Copy URL"}</button><button type="button" onClick={() => void remove(item)} className="media-delete-button" aria-label="Delete media"><Trash2 size={15} /></button></div></div><div className="media-card-content"><strong className="media-filename" title={item.originalName}>{item.originalName}</strong><span className="media-meta">{humanBytes(item.size)} · {formatDate(item.createdAt)}</span><label className="form-field media-alt-field"><span>Alternative text</span><input value={altDrafts[item.id] ?? ""} onChange={(event) => setAltDrafts((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Describe this image" maxLength={300} /></label><button type="button" className="text-link media-save-alt" onClick={() => void saveAlt(item)}><Check size={13} /> Save alt text</button><code className="media-url" title={item.url}>{item.url}</code></div></article>)}</div>}
    <div className="media-footnote">Image URLs can be pasted into the post cover field or an Image section in the page builder. <Link href="/admin/pages" className="text-link">Build a page <span>↗</span></Link></div>
  </div>;
}
