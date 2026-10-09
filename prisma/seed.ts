import { PrismaClient, ContentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisPassword123!";
  const name = process.env.ADMIN_NAME || "Jeet Shaw";

  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN" },
    create: { name, email, passwordHash, role: "ADMIN" }
  });

  const posts = [
    {
      title: "A calmer way to publish on the web",
      slug: "a-calmer-way-to-publish-on-the-web",
      excerpt: "A small editorial workflow can make publishing feel less like a chore and more like a craft.",
      category: "Product & Design",
      coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=85",
      content: "<p>Good publishing tools should make the important work feel obvious. A clear draft, a quiet editor, and a predictable publish action help writers focus on the ideas rather than the interface.</p><h2>Make the next step clear</h2><p>Editorial software works best when it communicates status and intent. Drafts should stay private. Published work should be easy to find, link to, and revisit.</p><blockquote>Great tools get out of the way without hiding what matters.</blockquote><p>This demo project explores those principles in a compact content management system.</p>"
    },
    {
      title: "Design systems are a conversation",
      slug: "design-systems-are-a-conversation",
      excerpt: "Reusable components are not just about consistency; they are a shared vocabulary for a team.",
      category: "Design Systems",
      coverImage: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
      content: "<p>A design system is a living agreement between design, engineering, and the people who use a product.</p><h2>Consistency with room to grow</h2><p>Reusable patterns create a baseline, while thoughtful exceptions allow a product to keep evolving. The goal is not uniformity at any cost; it is a product that feels coherent.</p><ul><li>Name components by intent.</li><li>Document states, not only appearances.</li><li>Invite feedback from the people using the system.</li></ul>"
    },
    {
      title: "What makes a useful admin dashboard?",
      slug: "what-makes-a-useful-admin-dashboard",
      excerpt: "A good dashboard answers the obvious questions first and keeps high-impact actions close at hand.",
      category: "Engineering",
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=85",
      content: "<p>An admin dashboard should not be a wall of numbers. It is a working space designed around decisions.</p><h2>Useful before impressive</h2><p>Show what changed, what needs attention, and what the user can do next. Make empty states helpful and destructive actions deliberate.</p><p>These simple decisions can have more impact than a complex chart that nobody acts on.</p>"
    }
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: {
        ...post,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        seoTitle: post.title,
        seoDescription: post.excerpt,
        authorId: admin.id
      }
    });
  }

  const homeLayout = [
    { id: "seed-hero", type: "hero", data: { eyebrow: "A little space for big ideas", title: "A journal for the curious.", subtitle: "Notes on design, technology, and making things that matter.", buttonText: "Explore the journal", buttonLink: "/#latest", align: "left" } },
    { id: "seed-text", type: "text", data: { title: "Thoughtful by design.", body: "A publication for ideas worth slowing down for. Explore practical notes, thoughtful essays, and small discoveries from the people building what comes next." } },
    { id: "seed-cta", type: "cta", data: { title: "Have an idea to share?", subtitle: "Create a draft in the studio and bring your next story to life.", buttonText: "Visit the studio", buttonLink: "/admin/login" } }
  ];

  await prisma.page.upsert({
    where: { slug: "our-studio" },
    update: {},
    create: {
      title: "Our Studio",
      slug: "our-studio",
      status: ContentStatus.PUBLISHED,
      layout: JSON.stringify(homeLayout),
      seoTitle: "Our Studio",
      seoDescription: "Learn about the editorial approach behind Draftline."
    }
  });

  await prisma.setting.upsert({ where: { key: "siteName" }, update: { value: "Draftline" }, create: { key: "siteName", value: "Draftline" } });
  await prisma.setting.upsert({ where: { key: "siteTagline" }, update: { value: "A journal for the curious." }, create: { key: "siteTagline", value: "A journal for the curious." } });

  console.log(`Seed complete. Administrator: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
