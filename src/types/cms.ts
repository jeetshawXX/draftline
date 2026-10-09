export type BlockType = "hero" | "text" | "image" | "features" | "cta";

export type PageBlock = {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  category: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  updatedAt: string;
  author?: { name: string };
};
