---
title: "Building a social platform on $5 a month"
description: "How Surbias runs on Cloudflare Workers + D1 + KV for somewhere between $0 and $5 a month — and why that constraint shapes the product more than the budget."
publishedAt: 2025-04-15
author: "Juan"
tags: ["engineering", "infra"]
---

Surbias's monthly bill last month was $0.43. That's not a typo. The whole platform — five languages, anonymous posting, moderation, search, comments, reactions, embeds, the works — costs less than a coffee.

I get asked how, often enough that it's easier to write it down once.

## The stack, briefly

- **Cloudflare Workers** for the runtime (Astro v6 in server mode, deployed via the `@astrojs/cloudflare` adapter)
- **D1** (Cloudflare's SQLite-at-the-edge) for the database
- **KV** for sessions
- **R2** if I ever add images (I haven't)
- **Cloudflare Images binding** for the responsive image pipeline

That's it. No Vercel, no separate Postgres, no Redis, no Lambda, no managed anything else. The CDN, the database, the runtime, the auth, and the assets all live inside Cloudflare's free or near-free tier.

## What costs money, what doesn't

The free tier here is genuinely generous. Workers gives you 100k requests a day. D1 gives you 5GB storage and 5M reads a day. KV is similar. Domain is $14/year. That's the only fixed cost.

The thing that *would* cost money is bandwidth-heavy use cases — millions of images, video, big file delivery. Surbias is text. Text is cheap.

The thing that almost cost me money is email. Resend's free tier is one verified domain per account, and I needed Surbias on a different account than my other projects. So I built an email adapter that supports Brevo (300/day free, no card), Mailjet, SendGrid, and Resend. First one configured wins. Whoever has the most generous free tier when you read this is probably the right answer.

## What this lets me do

**Run forever without revenue pressure.** Five dollars a month is a coffee. I can keep this up with no users, no donations, no plan, indefinitely. That changes everything about how I make decisions. I'm not building toward an exit. I'm not building toward a fundraise. I'm building toward the version of the site I want to use myself, and if it stays small, that's fine.

**Skip half the architecture conversations.** "Should we use a separate read replica?" No. "What's our database migration strategy?" Drizzle, push, that's it. "How do we handle auth?" better-auth + the same D1 database. The constraint of using one provider with one runtime and one database eliminates 80% of the decisions you'd otherwise have to make.

**Focus on the product, not the platform.** Every hour I'm not configuring infrastructure is an hour I'm reading posts and thinking about what's missing.

## What this *doesn't* let me do

**Heavy compute.** No machine learning inference. No on-the-fly video transcoding. No background jobs that run for minutes. Workers are short-lived. If I needed any of this, I'd need to add another provider, which would multiply my surface area and probably my bill.

**Big-batch analytics.** D1 is great for OLTP — read this row, write this row. It's not built for "scan a billion rows and aggregate." For now, my analytics fit in a SQL window function. If they didn't, I'd need a different database.

**Vendor independence.** I'm fully locked into Cloudflare. If they changed pricing or limits dramatically, I'd be in trouble. I've thought about this and I'm okay with it. The risk is real but the alternative is a stack three times more complex to save against an event that probably won't happen.

## The decisions the budget made for me

This is the part most posts about cheap infrastructure miss: **the budget shapes the product, not just the bill.**

Because I'm on Workers, every page response has to be fast — there are CPU limits per request. So I avoided heavy SSR frameworks and stuck with Astro, which lets me ship mostly static HTML with a sprinkle of JS where needed. The site is fast partly because it has to be.

Because storage is cheap but bandwidth is the real cost driver, I aggressively keep stories text-only. No images on stories (yet). No video. The platform is constrained to its core medium — words — partly because that's what's cheapest to host. I think this is also better product design, but the budget is what enforced it.

Because I can't do real-time without WebSockets (Workers don't really do them well), I made comments and reactions polling-based. Every 30s, the page checks for new comments. This is unfashionable but it works fine and I never thought about it again. If I had infinite money, I might have built a real-time presence system that I'd then have to maintain forever.

## What I'd tell someone starting now

If you're building a side project and you think you need Vercel + Postgres + Upstash + Mailgun + Algolia + Cloudinary + a CDN + Sentry, **you probably need none of those.**

Start with one provider. Cloudflare is the cheapest. Hetzner + a single VPS is the most flexible. Pick one. Don't add the second until you have a real reason — not "best practices," not "scalability," not "what real companies do." A real reason is "this thing my actual users are asking for is impossible without it."

You'll be amazed how far you can go with one box, one database, one cache, one email provider, and one domain. The complexity that real companies handle isn't a feature; it's a tax they pay because they got too big to back out.

If your project is small, stay small. The budget is doing you a favor.

— Juan
