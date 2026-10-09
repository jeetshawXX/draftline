# Draftline CMS — Manual Test Plan

Run these tests against a locally seeded development instance before submission. Record **Pass / Fail**, the date, and relevant screenshots in your final submission copy. Do not mark a test as passed until it has actually been performed.

## A. Installation and health

| ID | Steps | Expected result |
| --- | --- | --- |
| A1 | Copy `.env.example` to `.env`, configure `AUTH_SECRET`, admin email/password, then run `npm install`, `npx prisma generate`, `npx prisma db push`, and `npm run db:seed`. | Dependency install and database setup finish without errors; seed reports the administrator email. |
| A2 | Run `npm run dev` and open `/`. | Public journal loads without a server error. |
| A3 | Open `/api/health`. | JSON reports `status: ok` and `database: connected`. |
| A4 | Run `npm run typecheck`, `npm run lint`, and `npm run build`. | All checks finish successfully; record the exact command output. |

## B. Authentication and authorization

| ID | Steps | Expected result |
| --- | --- | --- |
| B1 | Open `/admin/login`, enter the configured admin credentials. | Browser enters `/admin`; dashboard statistics load. |
| B2 | Enter an incorrect password. | Error message appears; no session is created. |
| B3 | Sign out, then reopen `/admin`. | The user is redirected to `/admin/login`. |
| B4 | While signed out, send a POST request to `/api/posts` with valid-looking JSON. | API returns `401 Authentication required`. No post is created. |
| B5 | Perform more than 10 login attempts from a single IP within ten minutes in a development environment. | The in-process throttle returns HTTP `429`; note that this is not a distributed production rate limiter. |

## C. Blog posts

| ID | Steps | Expected result |
| --- | --- | --- |
| C1 | Open Posts → Write a post, enter a title, excerpt, category, formatted content, and save as draft. | A draft post is stored and appears in the admin list with Draft status. |
| C2 | Visit `/` and try opening `/blog/<draft-slug>`. | The draft is not listed publicly and the detail route returns not found. |
| C3 | Publish the draft. | Status changes to Published and the post appears on the public homepage. |
| C4 | Open its public detail page. | Title, excerpt, metadata, cover image (if set), and formatted body are displayed. |
| C5 | Edit and save the post, then reload the page. | Saved changes persist after reload. |
| C6 | Try to create a second post using an existing slug. | API shows a duplicate-slug error; database uniqueness remains intact. |
| C7 | Add unsupported HTML or a `javascript:` link through an API request, then inspect rendered content. | The sanitizer removes unsafe elements/schemes; no script executes. |
| C8 | Delete a test post from admin. | It disappears from the admin list and its public route is no longer available. |

## D. Visual pages

| ID | Steps | Expected result |
| --- | --- | --- |
| D1 | Open Pages → Create a page. | Page editor opens with an empty canvas. |
| D2 | Add Hero, Text, Image, Feature Grid, and CTA blocks. | All selected blocks appear in the canvas with editable fields. |
| D3 | Drag a section to a new position and save. | The changed order persists after reload. |
| D4 | Use Move up / Move down buttons. | Section order changes without dragging. |
| D5 | Publish the page and open `/p/<slug>`. | The stored sections render in the configured order. |
| D6 | Create a draft page and try its public route. | Public route returns not found until published. |
| D7 | Enter a duplicate page slug. | API reports a conflict; existing page remains unchanged. |

## E. Media library

| ID | Steps | Expected result |
| --- | --- | --- |
| E1 | Upload a valid JPG, PNG, WEBP, or GIF under the configured size cap. | API stores the file and returns its metadata; it appears in the media grid. |
| E2 | Open the returned `/api/uploads/<filename>` URL. | Browser receives the stored image with its correct MIME type. |
| E3 | Upload a text file renamed as `.jpg` or an unsupported format. | API rejects the upload. |
| E4 | Upload an image larger than the size cap. | API returns an error and does not create a media record. |
| E5 | Change alt text, save it, and reload the library. | The alternative text persists. |
| E6 | Copy URL and paste it into a post cover image field or Image block. | Image displays on the relevant public view. |
| E7 | Delete a test image. | The media record and stored file are removed; do not delete files still in use by published content. |

## F. Responsive and deployment checks

| ID | Steps | Expected result |
| --- | --- | --- |
| F1 | Check homepage, article page, login, post editor, page builder, and media library at desktop and mobile viewport widths. | No horizontal page overflow; key actions stay reachable. |
| F2 | Use keyboard navigation in the admin forms and page builder. | Inputs and move controls are accessible; focus is visible. |
| F3 | Deploy with persistent database and upload storage configured. Create a post and upload an image. Restart/redeploy the service. | Post, page, and media metadata and bytes remain present. |
| F4 | Visit the deployed `http://` URL, then the `https://` URL. | The provider redirects HTTP to HTTPS and the secure site loads without browser certificate warnings. |
| F5 | Change `ADMIN_PASSWORD` and restart using the documented seed-on-start workflow. | Seed updates the admin password hash; only the new password succeeds. |

## Test execution record

| Date | Environment / commit | Typecheck | Lint | Build | Manual tests | Tested by |
| --- | --- | --- | --- | --- | --- | --- |
| To complete | Local / commit SHA | Not run | Not run | Not run | Not run | Jeet Shaw |

**Important:** Replace the “Not run” entries only with observed results and include error logs or follow-up fixes for failed tests.
