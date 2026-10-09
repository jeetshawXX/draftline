# Project Report: Draftline — Content Management System for a Blog

**Intern:** JEET SHAW  
**Organization:** UCT (as named in the internship brief)  
**Internship area:** Full Stack Web Development  
**Project:** Content Management System for a Blog  
**Date:** 9 October 2026  
**Mentor / department / internship dates:** To be completed from official internship records

---

## 1. About the Organization — UCT

UCT is the organization identified in the supplied Full Stack Internship project brief. The brief describes project scope as being influenced by current industry needs and work carried out within the company, and includes a content management system for a blog as one of the project areas.

This project was developed against that brief to demonstrate a practical full-stack product: a web application that combines an editor-friendly interface, backend APIs, structured database storage, administration and public publishing. The official expanded company name, website, address, department, mentor name, and internship dates should be taken directly from UCT's offer letter or onboarding material and added here before final submission. No unverified corporate details have been assumed.

## 2. Project Background

A content management system (CMS) enables people to create, organize, update, and publish website content without manually editing every page in code. Platforms such as WordPress and Drupal demonstrate why this class of software is useful: content creators need writing tools, website owners need layout control, and visitors need reliable published pages.

A lightweight CMS for a blog must bring several workflows together:

- Authors need a text editor that supports structured content such as headings, paragraphs, lists, links, images, and quotations.
- Website owners need to compose page layouts using reusable content sections instead of manually building every page.
- Administrators need to store drafts, review the final result, and publish only when ready.
- Visitors need published content to load from the database through stable public URLs.
- Administrators need to manage image assets, page metadata, and website content through one interface.

Draftline was designed as an end-to-end student project that demonstrates these workflows in one codebase.

## 3. Problem Statement

**Problem:** Creating and maintaining a blog website often requires technical assistance for routine content and layout changes. Writers may need to edit code to publish text, while website owners may need a developer to rearrange sections or add images. Without clear draft/publish separation, structured storage, and a usable administration area, publishing becomes slower and harder to maintain.

**Proposed solution:** Build a browser-based content management system where an administrator can authenticate, create or edit blog posts in a rich-text editor, arrange visual page blocks by drag-and-drop, upload images, save drafts, publish content, and serve published posts and pages from a database on public routes.

## 4. Relevance to the Internship Brief

The project directly addresses the UCT brief's requested capabilities:

| Brief requirement | Implementation in Draftline |
| --- | --- |
| Full-stack web application | Next.js frontend and route-handler APIs with database persistence |
| Drag-and-drop page design | dnd-kit-based block reordering and editable Hero, Text, Image, Feature Grid, and CTA sections |
| Text editor for blog content | Tiptap rich-text editor with common writing and formatting commands |
| Store content in a database | Prisma models for users, posts, pages, media, and settings |
| Publish blog posts | Draft/published status, public post listing, and `/blog/[slug]` detail routes |
| Display owner-designed pages | Stored JSON layout rendered by `/p/[slug]` using reusable block components |
| Media content support | Image upload, file type/signature validation, alt-text field, and persistent upload directory configuration |
| HTTP/HTTPS delivery | Runs as a Node web service; HTTPS is supplied by the deployment platform and must be verified after deployment |

The brief mentions WordPress and Drupal as examples of CMS products. Draftline is an original educational implementation of similar foundational workflows, not a replacement for their full production feature set.

## 5. Project Objectives

1. Deliver a clean and responsive public blog interface.
2. Build a protected administrator studio for posts, pages, and media.
3. Implement rich-text authoring and persist the resulting content.
4. Allow a page owner to add, edit, reorder, and remove reusable layout blocks.
5. Support a clear draft-to-published content lifecycle.
6. Validate user input, sanitize rich-text HTML, and enforce admin authorization on mutation APIs.
7. Document local setup, manual testing, GitHub publication, and HTTPS deployment.

## 6. System Design

### 6.1 Architecture

Draftline uses a single Next.js application to reduce deployment and integration overhead while retaining a clear separation of responsibilities.

```text
Browser
  ├── Public journal: /, /blog/[slug], /p/[slug]
  └── Admin studio: /admin/*
             │
             ▼
      Next.js route handlers
      ├── Authentication / session
      ├── Posts API
      ├── Pages API
      ├── Media API
      └── Health / overview
             │
             ├── Prisma ORM ── SQLite database
             └── Upload storage ── raster image files
```

### 6.2 Technology Stack

- **Next.js App Router:** application routing, server-rendered public pages, and REST-style route handlers.
- **React and TypeScript:** reusable interface components and typed data structures.
- **Tailwind CSS and custom CSS:** responsive styling and consistent visual tokens.
- **Tiptap:** rich-text editing interface with headings, formatting, lists, links, images, quotations, and code blocks.
- **dnd-kit:** drag-and-drop sorting for page sections, with keyboard-based movement support.
- **Prisma ORM and SQLite:** relational persistence for posts, pages, media, users, and settings.
- **bcryptjs:** administrator password hashing.
- **jose:** signing and verifying expiring session tokens.
- **Zod:** request payload validation.
- **sanitize-html:** removing unsafe tags and attributes from submitted rich text.

### 6.3 Data Model

**User:** stores administrator identity, email, role, and password hash.  
**Post:** stores title, unique slug, excerpt, rich-text HTML, cover image URL, category, status, SEO fields, author, and timestamps.  
**Page:** stores title, unique slug, status, SEO data, timestamps, and JSON-serialized ordered page blocks.  
**Media:** stores original filename, generated storage filename, MIME type, byte size, public API URL, alternative text, uploader, and timestamp.  
**Setting:** stores basic key/value website settings.

The post/page status uses two states: `DRAFT` and `PUBLISHED`. Public listing and detail queries explicitly filter out drafts.

### 6.4 User Interface Design

The visual direction is an editorial studio: warm off-white backgrounds, dark ink text, forest-green accents, and a lime highlight used for primary actions. The interface includes a public journal homepage, article detail layout, a left-navigation admin workspace, compact content tables, edit forms, and a page-builder canvas.

The responsive layout adjusts navigation, forms, card grids, editor controls, and the sidebar for smaller viewports. The visual system aims to keep the writing workflow prominent and secondary metadata quiet.

### 6.5 Key Workflows

**Post workflow:** administrator signs in → creates or edits post → fills title, slug, category, excerpt, and rich-text body → saves as draft or publishes → the published post becomes accessible on the public journal and its slug-based detail route.

**Page workflow:** administrator opens Pages → creates a page → adds reusable sections → edits block properties → drags or moves sections to change order → saves the layout → publishes the page → visitors view the rendered sections at `/p/[slug]`.

**Media workflow:** administrator uploads an image → API checks file type, size, and file signature → file is written into the configured upload directory → database metadata and URL are stored → the image URL can be reused in a post or page block.

## 7. Implementation Details

### 7.1 Frontend

The public site includes the journal homepage, featured story and recent story lists, article detail pages, related-story cards, and custom page routes. The admin interface includes an overview, post list and editor, page manager and visual builder, and media library.

Shared components include the public navigation, admin shell, rich-text editor, page-block editor, and public block renderer. Consistent buttons, status pills, content panels, and field styling help keep interactions predictable.

### 7.2 Backend APIs

| Endpoint | Method(s) | Purpose |
| --- | --- | --- |
| `/api/auth/login` | POST | Validate credentials and set the admin session cookie |
| `/api/auth/logout` | POST | Clear the session cookie |
| `/api/auth/me` | GET | Return the current administrator |
| `/api/overview` | GET | Return dashboard statistics and recently updated posts |
| `/api/posts` | GET, POST | List public/admin posts and create a post |
| `/api/posts/[id]` | GET, PATCH, DELETE | Read, update, or delete a post |
| `/api/pages` | GET, POST | List pages and create a page |
| `/api/pages/[id]` | GET, PATCH, DELETE | Read, update, or delete a page |
| `/api/media` | GET, POST | List media and upload an image |
| `/api/media/[id]` | PATCH, DELETE | Update alt text or delete a media item |
| `/api/uploads/[filename]` | GET | Serve a validated stored image file |
| `/api/health` | GET | Verify database connectivity |

### 7.3 Authentication and Input Safety

- Passwords are stored as bcrypt hashes, not as plaintext.
- Successful login creates a signed, expiring session token in an HTTP-only, same-site cookie.
- API endpoints that change or expose administrative data verify the current administrator.
- Request bodies are validated with Zod and fields have maximum lengths.
- Blog rich-text HTML is sanitized before it is stored and again before it is rendered on a public detail page.
- Image uploads allow only selected raster formats, enforce a configurable size ceiling, check basic file signatures, and use generated filenames instead of trusting the submitted filename.
- Admin mutations require a valid session. Public content queries only return published records.

These controls are a reasonable educational baseline, not a security audit. Before production use, the project should add centralized rate limiting, robust CSRF/origin handling appropriate to the deployment, security headers and a Content Security Policy, observability, backups, and a more comprehensive threat review.

### 7.4 Database and Deployment

SQLite is the default because it makes local setup straightforward. The application supports `DATABASE_URL` and `UPLOAD_DIR` configuration so a persistent host disk can store the database and uploaded images. A production deployment must use persistent storage and verify HTTPS/HTTP redirects. For multi-instance scaling, PostgreSQL and object storage are recommended.

## 8. Results

The source tree implements the core end-to-end workflows required by the brief: rich-text post editing, draft/publish state, stored posts/pages, reorderable visual page sections, media management, public rendering, and a protected admin studio.

The repository also includes local setup commands, a sample seed dataset, a manual acceptance test plan, and deployment instructions. Because the result should be evaluated in the target Node.js environment, final runtime/build status must be recorded only after `npm install`, Prisma setup, `npm run typecheck`, `npm run lint`, `npm run build`, and the manual tests in `docs/TEST_PLAN.md` have been run successfully. Do not state performance scores or claim that a live deployment has passed HTTPS checks unless those checks were actually completed.

### Acceptance criteria

- [ ] A seeded administrator can log in and log out.
- [ ] A draft post is absent from the public homepage and cannot be opened from its public slug.
- [ ] A published post appears on the homepage and its detail page renders formatted HTML.
- [ ] A page can be built from several block types and its sections can be reordered.
- [ ] A published page is available at `/p/[slug]`; a draft is not publicly available.
- [ ] An allowed image uploads and renders; an unsupported or oversized file is rejected.
- [ ] An unauthenticated client cannot create, update, or delete posts/pages/media.
- [ ] The application passes TypeScript, lint, and production build checks.
- [ ] The deployed website redirects HTTP to HTTPS and retains data after a service restart.

## 9. Learnings

This project provides practical experience in:

1. **Full-stack integration:** connecting reusable React components to server-side route handlers and persisted data.
2. **Relational data modeling:** defining relationships between users, posts, and media, and representing page layouts as structured JSON.
3. **Authentication:** hashing passwords, signing short-lived/expiring claims, setting secure cookies, and protecting API mutations.
4. **Rich-text handling:** converting editor operations into HTML while understanding why server-side sanitization matters.
5. **Drag-and-drop interfaces:** separating block data from presentation, managing reorder operations, and supporting non-drag movement controls.
6. **Content lifecycle design:** modeling drafts and published content and applying visibility rules to public queries.
7. **Media management:** validating uploads, using safe generated filenames, and separating file metadata from file bytes.
8. **Responsive frontend engineering:** building a visual system from consistent typography, spacing, colors, reusable components, and mobile layouts.
9. **Delivery practices:** environment configuration, database seeding, Git/GitHub workflow, production build checks, and HTTPS deployment planning.

## 10. Future Enhancements

- Add editor autosave, version history, scheduled publishing, and preview links for drafts.
- Add multi-user roles such as editor and author with per-post permissions.
- Add categories/tags as normalized database models and provide public category pages.
- Add full-text search and paginated content listings.
- Add image cropping, image metadata, object storage, and CDN delivery.
- Add automated component/API tests and a CI workflow for type checking, linting, and builds.
- Add analytics, structured metadata, sitemap generation, and RSS feed support.
- Move to PostgreSQL and a shared rate limiter if the application needs multiple instances or concurrent editorial teams.

## 11. Conclusion

Draftline demonstrates a practical full-stack content management system aligned with the UCT internship brief. It connects the public publishing experience to an administrator-facing editor, structured persistence, reusable visual blocks, and media workflows. The implementation is designed to be approachable for a student developer while highlighting the engineering concerns that matter in a real CMS: clear content states, authorization, input validation, maintainable components, responsive design, and dependable deployment practices.

**Submitted by:** JEET SHAW
