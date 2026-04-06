# Surbias.com - Full Site Audit

**Date:** April 5, 2026
**Scope:** Architecture, Security, UX, i18n, Logic, Admin, Performance, SEO
**Files reviewed:** 60+ files across the entire codebase

---

## Table of Contents

1. [Critical Security Issues](#1-critical-security-issues)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Input Validation & Content Safety](#3-input-validation--content-safety)
4. [Internationalization (i18n)](#4-internationalization-i18n)
5. [Accessibility (a11y)](#5-accessibility-a11y)
6. [UX & Frontend Issues](#6-ux--frontend-issues)
7. [SEO Issues](#7-seo-issues)
8. [Performance](#8-performance)
9. [Database & Schema](#9-database--schema)
10. [Admin Panel](#10-admin-panel)
11. [Build & Deploy Pipeline](#11-build--deploy-pipeline)
12. [Missing Pages & Features](#12-missing-pages--features)
13. [Code Quality](#13-code-quality)
14. [Ideas for New Features](#14-ideas-for-new-features)

---

## 1. Critical Security Issues

### 1.1 XSS in Dynamic Comment Rendering
**File:** `src/components/pages/PostDetailPage.astro` ~line 170
**Severity:** CRITICAL

Comment content inserted via `innerHTML` with only `<` escaping. Attackers can inject via event handlers or HTML entities.

**Fix:** Use `textContent` instead of `innerHTML` for user-generated content, or use a proper sanitizer like DOMPurify.

### 1.2 No CSRF Protection
**Files:** All POST endpoints (`/api/posts`, `/api/admin/moderate`, `/api/posts/[id]/comments`)
**Severity:** CRITICAL

No CSRF token validation on any state-changing operations. Forms use POST but no token verification.

**Fix:** Add CSRF token generation and validation. Set `SameSite=Strict` on cookies. Validate Origin/Referer headers.

### 1.3 Rate Limiting Easily Bypassed
**File:** `src/lib/rate-limit.ts`
**Severity:** CRITICAL

Rate limiting uses IP + User-Agent hash. Both are easily spoofed. Daily reset allows burst attacks at boundaries. Fallback to `'unknown'` means unknown IPs share limits.

**Fix:** Use Cloudflare's built-in rate limiting. Implement per-session rate limiting for authenticated users. Add exponential backoff.

### 1.4 Missing Authentication on Public Endpoints
**Files:** `/api/posts/[id]/react.ts`, `/api/posts/[id]/flag.ts`, `/api/posts/[id]/comments.ts`
**Severity:** HIGH

These endpoints use session hashing for deduplication but don't authenticate users. Reactions, flags, and comments can be spoofed.

**Fix:** Use actual user IDs when authenticated, fall back to session hash for anonymous.

### 1.5 Missing Content Security Policy
**Severity:** HIGH

No CSP headers configured. Browser won't prevent inline script injection or cross-origin resource loading.

**Fix:** Add CSP headers via Cloudflare Workers middleware:
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
```

---

## 2. Authentication & Authorization

### 2.1 No Logout Button
Header shows login link but no logout for authenticated users. Better-auth provides logout, but the frontend doesn't expose it.

### 2.2 No Password Reset Flow
Login page has email/password but no "Forgot password" link.

### 2.3 No Email Verification
`emailVerified` field exists in schema but is never set to true. Users can sign up with fake emails.

### 2.4 No User Profile/Account Page
Users can register but can't view/edit their info, see their posts, or delete their account.

### 2.5 Admin Auth is Email-Only
Admin check uses `session?.user?.email === env.ADMIN_EMAIL`. No RBAC, no audit logging. Compromised email = compromised admin.

**Fix:** Implement role-based access control with an `admin` flag in the users table. Add admin action audit logging.

---

## 3. Input Validation & Content Safety

### 3.1 Inadequate Post Validation
**File:** `src/lib/moderation.ts`
- Title validation allows 3+ spaces (checks trimmed length but post can be titled `"   "`)
- Blocked words use simple `.includes()` — easily bypassed with variations
- No Unicode normalization (homograph attacks possible)

### 3.2 Comment Validation is Minimal
**File:** `/api/posts/[id]/comments.ts`
Only checks length (2-2000 chars). No URL limiting, no keyword checking, no honeypot.

**Fix:** Apply same validation pipeline as posts.

### 3.3 Auto-Flag Threshold Too Low
**File:** `/api/posts/[id]/flag.ts`
Posts auto-hidden after 3 flags without human review. Enables coordinated flagging attacks to silence legitimate posts.

**Fix:** Increase threshold to 5-10. Queue for admin review instead of auto-hiding. Implement appeals process.

### 3.4 Turnstile Verification Gaps
**File:** `src/lib/turnstile.ts`
- No fetch timeout (could hang indefinitely)
- No HTTP response status validation
- IP parameter optional but critical for spoofing prevention
- Missing error code threshold checking

---

## 4. Internationalization (i18n)

### 4.1 Hardcoded English Strings (CRITICAL)
Multiple components contain hardcoded English text that doesn't change when switching language:

| File | String | Should Use |
|------|--------|------------|
| `PostCard.astro` line 73 | `"Read →"` | `i.post.read_more` |
| `Header.astro` lines 43, 83 | `"☕ Buy us a coffee"` | `i.common.footer_coffee` |
| `PostDetailPage.astro` line 50 | `"Categories"` | `i.common.categories_title` |
| `PostDetailPage.astro` line 66 | `"User"` | Should use locale text |
| `PostDetailPage.astro` line 86 | `"Write a comment..."` | `i.common.write_comment` |
| `PostDetailPage.astro` line 90 | `"Anonymous"` | `i.common.anonymous` |
| `PostDetailPage.astro` line 92 | `"Comment"` button | `i.common.comment` |
| `PostDetailPage.astro` lines 128-145 | `alert()`/`prompt()` dialogs | Should be i18n modal |
| `Footer.astro` lines 44-45 | `"Terms of Service"`, `"Privacy Policy"` | New i18n keys |
| `HomePage.astro` line 234 | `"No stories yet..."` in JS | `i.common.empty` |

### 4.2 timeAgo() Returns English Only
**File:** `src/i18n/index.ts` lines 38-46

The `timeAgo()` function ignores the `_locale` parameter and returns hardcoded English strings (`"< 1 min"`, `"h"`, `"d"`, `"mo"`).

**Fix:** Add time-related keys to all i18n JSON files. Make `timeAgo()` use the locale parameter.

### 4.3 Legal Pages Not Localized
`/terms` and `/privacy` only exist in English. No locale versions for ES, DE, FR, PT. Footer links are not locale-aware.

### 4.4 Missing i18n Keys
Need to add to all JSON files: `post.read_more`, `nav.coffee_cta`, `footer.terms`, `footer.privacy`, time-related keys.

---

## 5. Accessibility (a11y)

### 5.1 No Skip-to-Content Link
Missing `<a href="#main" class="skip-link">Skip to content</a>` in Base.astro. Users must tab through entire header.

### 5.2 Language Switcher Missing Label
`<select>` element in LanguageSwitcher.astro has no associated `<label>`. Uses inline `onchange` handler (not accessible).

### 5.3 Inline Event Handlers
PostDetailPage.astro uses `onclick` for report button. Should use `addEventListener` in a script block.

### 5.4 Dynamic Content Not Announced
JavaScript-rendered content (category filtering, new comments) uses `innerHTML` which doesn't update the accessibility tree. Screen readers won't announce new content.

**Fix:** Use `aria-live="polite"` regions for dynamic content areas.

### 5.5 Focus Management
No visible focus indicators defined in CSS beyond browser defaults. Mobile hamburger menu doesn't trap focus when open.

---

## 6. UX & Frontend Issues

### 6.1 Browser Dialogs for User Actions
Report post uses `prompt()` and `alert()` — blocks the page and is terrible UX. Login errors use `alert()`.

**Fix:** Create a reusable modal component. Replace all `alert()`/`prompt()` calls.

### 6.2 Silent Error Handling
Comment submission (`catch {}`) silently fails. Post reactions silently fail. No user feedback on errors.

**Fix:** Show toast notifications or inline error messages.

### 6.3 CSS Variable Mismatch
Header.astro uses `var(--color-primary)`, `var(--color-surface)`, `var(--color-text-primary)` etc. which are NOT defined in global.css. Global CSS defines `var(--surbias-primary)`, `var(--surbias-bg)`, etc.

**Fix:** Either define `--color-*` aliases in global.css or update Header/Footer to use `--surbias-*` variables.

### 6.4 No Loading States
No loading indicator when filtering categories, sorting posts, or submitting comments.

### 6.5 Coffee Button Inconsistent Style
Header coffee button uses hardcoded colors (`#f8f0e3`, `#8b6914`) that don't use CSS variables and don't match the theme.

---

## 7. SEO Issues

### 7.1 Missing Meta Tags
- No `og:image` or `twitter:image` — social sharing has no preview
- No `og:locale` or `<link rel="alternate" hreflang="...">` for i18n
- No `theme-color` meta tag
- No `robots` meta tag
- Post detail pages should have `og:type="article"` with `article:published_time`

### 7.2 No Structured Data
Missing JSON-LD for `BlogPosting`, `Organization`, `BreadcrumbList`.

### 7.3 No Sitemap or Robots.txt
No `sitemap.xml` or `robots.txt` found. Search engines can't efficiently crawl the site.

### 7.4 No Dynamic Meta Descriptions
Post detail pages use the generic site description instead of the first 160 chars of the post body.

---

## 8. Performance

### 8.1 Duplicate Script Loading
Turnstile script loaded in PostForm.astro. If the inline form and another form exist on the same page, the script loads twice.

**Fix:** Load Turnstile once in Base.astro, or add dedup logic.

### 8.2 Large Inline JavaScript
HomePage.astro has 184 lines of inline script for client-side filtering. Duplicates `timeAgo()` logic from i18n/index.ts.

### 8.3 Font Weight Overhead
Loading 5 font weights (300, 400, 500, 600, 700) for Outfit. Consider if 300 and 700 are actually used.

### 8.4 CSS is 1500+ Lines
No code-splitting or critical CSS extraction. All styles loaded on every page.

### 8.5 No Image Optimization
Logo PNG loaded without `srcset`, `loading="lazy"`, or responsive sizes.

---

## 9. Database & Schema

### 9.1 Missing Indexes
Critical queries filter by `posts.status`, `posts.category`, `posts.locale`, `posts.createdAt` but none have indexes. This will cause full table scans as data grows.

**Fix:** Add migration with indexes:
```sql
CREATE INDEX idx_posts_status_created ON posts(status, created_at);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_locale ON posts(locale);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_flags_target ON flags(target_type, target_id);
```

### 9.2 Race Conditions in Reaction Counts
Between reading and writing reaction counts, concurrent requests can cause lost updates. The `reactionCounts` JSON field should be replaced with SQL aggregation.

### 9.3 `rate_limits` Table Not in Schema
Created in migration 0000 but not defined in `src/db/schema.ts`. Accessed via raw SQL only — no type safety.

### 9.4 Default Locale Mismatch
Migration 0000 defaults locale to `'es'` but schema.ts defaults to `'en'`. Existing records may have wrong defaults.

### 9.5 No CHECK Constraints
No validation on `status` values, `flagCount >= 0`, valid categories, or valid locales at the database level.

---

## 10. Admin Panel

### 10.1 No Rate Limiting on Admin API
Admin endpoint `/api/admin/moderate` has no rate limiting. Could be abused if admin session is compromised.

### 10.2 No Audit Logging
No record of admin actions (who deleted/restored/banned what, when). Critical for accountability.

### 10.3 Duplicated Code
Admin sidebar navigation and styles are copy-pasted across all 4 admin pages. Should be extracted into a shared layout component.

### 10.4 No Comment Moderation
Admin can manage posts, users, and flags but has no interface to moderate comments.

---

## 11. Build & Deploy Pipeline

### 11.1 Hardcoded KV Namespace ID
`deploy.sh` hardcodes the KV namespace ID. Should be sourced from environment.

### 11.2 No Environment Validation
Deploy script doesn't check if required secrets are set before deploying.

### 11.3 No `.env.example`
Hard to set up a new environment without documentation of required variables.

### 11.4 Post-Build Config Manipulation
Deploy script deletes fields from generated `wrangler.json` as a workaround. This is fragile and undocumented.

---

## 12. Missing Pages & Features

### 12.1 Missing Error Pages
- No `404.astro` — users see default Astro error page
- No `500.astro` — server errors show raw error

### 12.2 Missing User Features
- No logout button
- No user profile page
- No "my posts" view
- No post editing or deletion by author
- No password reset
- No email verification
- No account deletion (GDPR requirement)

### 12.3 Missing App Features
- No search functionality
- No comment pagination (only first 50 loaded)
- No notification system
- No post sharing (social share buttons)
- No RSS feed

### 12.4 Legal Pages Not Localized
Terms and Privacy only in English. Need versions for all 5 supported languages.

---

## 13. Code Quality

### 13.1 Duplicated timeAgo() Function
Implemented in: `i18n/index.ts`, `HomePage.astro`, `admin/index.astro`, `admin/posts.astro`, `admin/flags.astro`. Should have a single source of truth.

### 13.2 Mixed SQL Patterns
Codebase mixes Drizzle ORM queries with raw SQL (rate-limit.ts). Should use Drizzle consistently.

### 13.3 Silent Error Handling
Multiple `catch {}` blocks that swallow errors without logging.

### 13.4 CSS Variable Naming Inconsistency
Global CSS uses `--surbias-*` prefix. Scoped component styles use `--color-*` prefix. Some components have hardcoded fallback values indicating variable uncertainty.

---

## 14. Ideas for New Features

### Community & Engagement
1. **Bookmarks/Saved Posts** — let users save posts to read later
2. **Follow Categories** — get notified when new posts appear in favorite categories
3. **Weekly Digest Email** — curated top stories of the week
4. **"Me too" Counter on Homepage** — show total "me too" reactions across all posts as a community stat
5. **Story Prompts** — weekly writing prompts to encourage sharing (e.g., "Tell us about a project that failed")
6. **Anonymous Replies** — let users reply to comments anonymously

### Content Discovery
7. **Search** — full-text search across posts and comments
8. **Tags/Hashtags** — let users tag their posts beyond categories
9. **Related Posts** — show similar stories at the bottom of each post
10. **RSS Feed** — `/feed.xml` for each language and category
11. **"Random Story" Button** — discover posts serendipitously
12. **Featured/Pinned Posts** — admin can pin important posts

### Social & Sharing
13. **Share to Twitter/LinkedIn/WhatsApp** buttons on each post
14. **Embeddable Widget** — let blogs embed Surbias stories
15. **Open Graph Images** — auto-generate preview images for social sharing with post title
16. **QR Code for Posts** — for offline sharing

### Gamification & Motivation
17. **Streak Counter** — "You've shared 5 stories this month"
18. **Badges** — "First Post", "10 Reactions Received", "Helpful Commenter"
19. **Anonymous Leaderboard** — most reactions received (opt-in)
20. **"Failure of the Week"** — community-voted spotlight

### Monetization & Growth
21. **Newsletter Signup** — collect emails for updates
22. **Merch Store** — "Because Failing is Normal" t-shirts
23. **Corporate Version** — private Surbias for companies (post-mortems, learning from failures)
24. **API for Developers** — public API to embed failure stories
25. **Podcast Integration** — curate stories into a weekly podcast

### Technical Improvements
26. **PWA Support** — offline reading, push notifications, installable app
27. **Real-time Comments** — WebSocket or SSE for live comment updates
28. **Image Uploads** — allow users to attach images to posts (via Cloudflare Images)
29. **Markdown Support** — rich text formatting in posts
30. **Analytics Dashboard** — public stats page (posts per day, category distribution, growth)
31. **A/B Testing Framework** — test different hero messages, CTA copy
32. **Dark Mode Toggle** — user-controlled (not just system preference)
33. **Email Notifications** — when someone reacts or comments on your post
34. **Spam Detection ML** — use Cloudflare AI for automated content moderation
35. **CDN-level Caching** — cache static pages at the edge for faster loads

---

## Priority Matrix

| Priority | Category | Items |
|----------|----------|-------|
| **P0 - Critical** | Security | XSS fix, CSRF tokens, CSP headers |
| **P0 - Critical** | i18n | Fix all hardcoded strings, timeAgo locale |
| **P1 - High** | Auth | Logout button, password reset, email verify |
| **P1 - High** | UX | Replace alert/prompt with modals, error feedback |
| **P1 - High** | DB | Add indexes, fix race conditions |
| **P1 - High** | Legal | Localize terms/privacy pages |
| **P2 - Medium** | SEO | Meta tags, structured data, sitemap |
| **P2 - Medium** | a11y | Skip link, aria-live, focus management |
| **P2 - Medium** | Pages | 404/500 error pages, user profile |
| **P2 - Medium** | Admin | Audit logging, comment moderation |
| **P3 - Low** | Perf | CSS splitting, font optimization, dedup scripts |
| **P3 - Low** | Code | Consolidate timeAgo, fix CSS vars, extract admin layout |

---

*Generated by Claude Opus 4.6 — Full codebase audit of Surbias.com*
