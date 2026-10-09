import Link from "next/link";
import type { PageBlock } from "@/types/cms";

function value(data: Record<string, unknown>, key: string, fallback = "") {
  const item = data[key];
  return typeof item === "string" ? item : fallback;
}

function safeHref(href: string, fallback: string) {
  const value = href.trim();
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return fallback;
}

function safeImageSrc(src: string) {
  const value = src.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "";
}

export function BlockRenderer({ blocks }: { blocks: PageBlock[] }) {
  return <div className="page-blocks">{blocks.map((block) => {
    const data = block.data || {};
    if (block.type === "hero") {
      return <section className={`builder-hero align-${value(data, "align", "left")}`} key={block.id}>
        <div className="builder-hero-inner">
          {value(data, "eyebrow") && <span className="eyebrow">{value(data, "eyebrow")}</span>}
          <h1>{value(data, "title", "A page worth exploring.")}</h1>
          <p>{value(data, "subtitle", "Make this space yours with the visual page builder.")}</p>
          {value(data, "buttonText") && <Link className="button button-dark" href={safeHref(value(data, "buttonLink", "/#latest"), "/#latest")}>{value(data, "buttonText")} <span>↗</span></Link>}
        </div>
      </section>;
    }
    if (block.type === "text") {
      return <section className="builder-text content-width" key={block.id}>
        {value(data, "title") && <h2>{value(data, "title")}</h2>}
        <p>{value(data, "body")}</p>
      </section>;
    }
    if (block.type === "image") {
      const src = safeImageSrc(value(data, "src"));
      return <figure className="builder-image content-width" key={block.id}>
        {src ? <img src={src} alt={value(data, "alt", "Editorial image")} loading="lazy" /> : <div className="image-placeholder">Add an image URL in the page builder</div>}
        {value(data, "caption") && <figcaption>{value(data, "caption")}</figcaption>}
      </figure>;
    }
    if (block.type === "features") {
      const items = value(data, "items", "Thoughtful design\nFlexible publishing\nSimple workflows").split("\n").filter(Boolean);
      return <section className="feature-grid content-width" key={block.id}>
        {value(data, "title") && <h2>{value(data, "title")}</h2>}
        <div className="feature-grid-items">{items.map((item, index) => <article className="feature-item" key={`${block.id}-${index}`}><span className="feature-index">0{index + 1}</span><h3>{item}</h3><p>Make your content clearer with a focused, flexible experience.</p></article>)}</div>
      </section>;
    }
    if (block.type === "cta") {
      return <section className="builder-cta content-width" key={block.id}>
        <div><h2>{value(data, "title", "Ready to make something?")}</h2><p>{value(data, "subtitle", "Your next idea starts here.")}</p></div>
        <Link className="button button-lime" href={safeHref(value(data, "buttonLink", "/admin/login"), "/admin/login")}>{value(data, "buttonText", "Get started")} <span>↗</span></Link>
      </section>;
    }
    return null;
  })}</div>;
}
