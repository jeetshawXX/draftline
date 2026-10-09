import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner page-wrap">
        <Link href="/" className="brand" aria-label="Draftline home">
          <span className="brand-mark">d.</span>
          <span>draftline<span className="brand-period">.</span></span>
        </Link>
        <nav className="public-nav" aria-label="Main navigation">
          <Link href="/#latest">Journal</Link>
          <Link href="/p/our-studio">Our studio</Link>
        </nav>
        <Link href="/admin/login" className="nav-cta">Open the studio <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
  );
}
