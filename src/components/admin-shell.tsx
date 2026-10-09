"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, BookOpen, ChevronDown, CircleHelp, FileText, FolderOpen, LayoutDashboard, LogOut, Menu } from "lucide-react";

type User = { id: string; name: string; email: string };
const navigation = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Posts", href: "/admin/posts", icon: BookOpen },
  { label: "Pages", href: "/admin/pages", icon: FileText },
  { label: "Media library", href: "/admin/media", icon: FolderOpen }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) { setChecking(false); return; }
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Authentication required");
      const result = await response.json();
      if (alive) setUser(result.user);
    }).catch(() => { if (alive) router.replace("/admin/login"); }).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [isLogin, pathname, router]);

  async function signOut() {
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); } finally { router.replace("/admin/login"); router.refresh(); }
  }

  if (isLogin) return <>{children}</>;
  if (checking || !user) return <div className="admin-loading"><span className="loading-dot" /><p>Opening your studio…</p></div>;

  return <div className="admin-app">
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <Link className="admin-brand" href="/admin"><span className="brand-mark">d.</span><span>draftline<span className="brand-period">.</span><small>CONTENT STUDIO</small></span></Link>
      <div className="workspace-card"><div className="workspace-symbol">D</div><div><strong>Draftline Journal</strong><small>Personal workspace</small></div><ChevronDown size={15} /></div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="admin-nav">{navigation.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link href={item.href} key={item.href} className={active ? "active" : ""} onClick={() => setMobileOpen(false)}><Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{item.label === "Posts" && <span className="nav-dot" />}</Link>;
      })}</nav>
      <div className="sidebar-bottom">
        <a href="/" target="_blank" rel="noreferrer" className="sidebar-view-link"><ArrowUpRight size={16} /><span>View live website</span></a>
        <div className="sidebar-help"><div className="help-icon"><CircleHelp size={16} /></div><div><strong>Need a hand?</strong><small>See the project guide</small></div><a href="https://nextjs.org/docs" target="_blank" rel="noreferrer" aria-label="Open Next.js documentation"><ArrowUpRight size={15} /></a></div>
        <div className="sidebar-user"><div className="user-avatar">{user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</div><div className="user-info"><strong>{user.name}</strong><small>{user.email}</small></div><button type="button" onClick={signOut} disabled={loggingOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div>
      </div>
    </aside>
    <main className="admin-main"><header className="admin-topbar"><button type="button" className="mobile-menu-button" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{navigation.find((item) => item.href === pathname || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) )?.label || "Overview"}</strong></div><div className="topbar-right"><span className="status-indicator"><i /> Workspace ready</span><span className="topbar-separator" /><div className="topbar-avatar">{user.name[0]?.toUpperCase() || "J"}</div><span className="topbar-name">{user.name}</span></div></header><div className="admin-content">{children}</div></main>
  </div>;
}
