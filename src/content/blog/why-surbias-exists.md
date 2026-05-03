---
title: "Why Surbias exists (and why it's free)"
description: "A short post on the problem Surbias is trying to fix — and the design choices that follow from that."
publishedAt: 2025-02-10
author: "Juan"
tags: ["meta", "philosophy"]
---

I built Surbias because I was tired of two things.

**One:** the ratio of polished success stories to honest failure stories on every social platform I use is something like 100:1. Every founder bio reads the same. Every "lessons I learned from getting fired" post on LinkedIn ends with a promotion three paragraphs later. The losers don't write articles, the dead startups don't tweet, and the people who tried hard and ended up obscure are quietly absent from the data.

**Two:** the personal cost of that. If you only see the survivors, your own setbacks feel disqualifying instead of normal. You start to believe you're the exception to a rule that was never real to begin with.

That's the bias the name comes from. *Survivorship bias.* Surbias is short for "Survivorship Bias Destroyer," which is intentionally a bit much, because the goal is also a bit much.

## The design choices

A few things follow from the goal:

- **Anonymous by default.** If you have to put your real name on a failure, almost nobody will. So the platform shouldn't require it.
- **No likes.** Likes optimize for performance. The platform should optimize for honesty. So the reactions are "me too," "hug," "strength," "respect," "solidarity" — what you actually feel reading a vulnerable story, not what makes the algorithm happy.
- **No follower count, no leaderboard.** Same reason. You can't optimize for status if there's no status to win.
- **Free, ad-free, tracker-free.** If the business model rewards engagement, the platform will eventually warp toward engagement. The only model I trust is: ask people who find value to chip in. So Surbias runs on Ko-fi tips. No ads, no investors, no exit pressure.

## The economics

Cloudflare Workers + D1 + KV: about $0–5 a month. Domain: $14 a year. I spend a lot of weekends on this. The whole thing could run forever on tip jar money.

If five people tip $3 a month, the infrastructure is paid for. If fifty do, I can hire someone to translate stories into more languages. If five hundred do, I can build the email digest properly. There's a long path here that doesn't require turning into LinkedIn.

If you want to support it: <a href="/support">/support</a>. If you don't have the budget, share a story. That's worth more than a tip.

— Juan
